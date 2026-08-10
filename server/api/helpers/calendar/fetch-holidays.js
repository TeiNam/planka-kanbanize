/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { URL } = require('url');
const { ProxyAgent } = require('undici');

const adaptHolidays = require('../../../utils/adapt-holidays');

// 외부 공휴일 API 호출 타임아웃(ms). download-favicon.js 의 값(4000ms)을 출발점으로 사용.
const FETCH_TIMEOUT = 4000;
// 응답 본문 크기 상한(bytes). download-favicon.js 의 값(1MB)을 출발점으로 사용.
const MAX_RESPONSE_LENGTH = 1024 * 1024;

// SSRF 완화: http/https 스킴만 허용 (R9.7, R13.3).
// 호스트 allow-list/프라이빗 IP 차단은 본 스코프 밖(design.md SSRF 절 참조).
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// endpoint 와 year/month 로 URL 을 안전하게 조립한다.
// 문자열 연결 대신 URL/searchParams 를 사용해 기존 쿼리스트링/경로가 깨지지 않게 한다.
// 구문 오류 또는 비-http(s) 스킴이면 null 을 반환한다.
const buildHolidayUrl = (endpoint, year, month) => {
  let url;
  try {
    url = new URL(endpoint);
  } catch (error) {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return null;
  }

  url.searchParams.set('year', year);
  url.searchParams.set('month', month);

  return url;
};

// 응답 본문을 스트리밍으로 읽되 MAX_RESPONSE_LENGTH 를 초과하면 중단하고 null 을 반환한다.
const readResponse = async (response) => {
  const reader = response.body.getReader();

  const chunks = [];
  let receivedLength = 0;

  for (;;) {
    const { value, done } = await reader.read(); // eslint-disable-line no-await-in-loop

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (receivedLength > MAX_RESPONSE_LENGTH) {
      reader.cancel();
      return null;
    }
  }

  return Buffer.concat(chunks);
};

// AbortController 기반 타임아웃을 적용해 fetch + 본문 읽기까지 수행한다 (R11.5).
// 외부 호출 대상은 project 에 저장된 endpoint 로 구성된 url 로만 한정된다 (R13.3).
// - 타이머는 본문 읽기가 끝난 뒤 해제한다. fetch 프라미스는 "헤더 도착" 시점에 resolve 되므로
//   그 시점에 clearTimeout 하면 본문이 느리게 오는 서버에서 읽기가 무기한 매달릴 수 있다.
// - redirect: 'error' 로 리다이렉트를 따라가지 않는다. 타 호스트로 리다이렉트되면
//   X-API-Key 헤더가 재전송되어 키가 유출될 수 있다.
// - apiKey 는 https 엔드포인트에만 전송한다. http 로 보내면 평문 노출된다.
const fetchAndRead = async (url, apiKey) => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT);

  if (apiKey && url.protocol !== 'https:') {
    sails.log.warn(
      `[fetch-holidays] http 엔드포인트에는 X-API-Key 를 전송하지 않습니다. https 로 전환하세요: ${url.host}`,
    );
  }

  try {
    const response = await fetch(url, {
      signal: abortController.signal,
      redirect: 'error',
      headers: apiKey && url.protocol === 'https:' ? { 'X-API-Key': apiKey } : undefined,
      dispatcher: sails.config.custom.outgoingProxy
        ? new ProxyAgent(sails.config.custom.outgoingProxy)
        : undefined,
    });

    if (!response.ok) {
      return null;
    }

    // abort 시 reader.read() 도 함께 거부되므로 본문 읽기까지 타임아웃이 적용된다.
    return await readResponse(response);
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  inputs: {
    endpoint: {
      type: 'string',
      allowNull: true,
    },
    apiKey: {
      type: 'string',
      allowNull: true,
    },
    year: {
      type: 'number',
      required: true,
    },
    month: {
      type: 'number',
      required: true,
    },
  },

  async fn(inputs) {
    const { endpoint, apiKey, year, month } = inputs;

    // endpoint 미설정/빈 문자열 → 공휴일 없음 (R10.4)
    if (!endpoint) {
      return [];
    }

    // URL 구문 검증 + http/https 스킴만 허용 (R9.7, R13.3). 실패 시 공휴일 없음.
    const url = buildHolidayUrl(endpoint, year, month);
    if (!url) {
      return [];
    }

    let buffer;
    try {
      buffer = await fetchAndRead(url, apiKey);
    } catch (error) {
      // 타임아웃/네트워크 오류/리다이렉트 → 공휴일 없음 (R11.1/11.5)
      return [];
    }

    // 비-OK 응답 또는 응답 본문 크기 초과 → 공휴일 없음
    if (!buffer) {
      return [];
    }

    // JSON 파싱 실패 → 공휴일 없음 (R11.4)
    let payload;
    try {
      payload = JSON.parse(buffer.toString());
    } catch (error) {
      return [];
    }

    // 정규화 (인식 불가 시 빈 배열) (R11.4)
    return adaptHolidays(payload);
  },
};
