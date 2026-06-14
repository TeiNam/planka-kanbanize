/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// 외부 공휴일 API의 다양한 응답 형태를 [{ date, name }] 로 정규화하는 어댑터.
// 인식 불가능한 형태/항목은 빈 배열 또는 제외로 처리한다(실패 시 안전한 빈 결과).

// 날짜 후보로 사용할 수 있는 키 (외부 API마다 다른 이름 대응)
const DATE_KEYS = ['date', 'localDate', 'day'];
// 명칭 후보로 사용할 수 있는 키
const NAME_KEYS = ['name', 'localName', 'title'];

// 날짜 문자열을 YYYY-MM-DD 로 정규화. 인식 불가 시 null 반환.
const normalizeDate = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // YYYY-MM-DD 또는 ISO 타임스탬프(예: 2026-01-01T00:00:00Z)에서 날짜 성분만 취함
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
};

// 후보 키 목록에서 비어있지 않은 첫 문자열 값을 선택
const pickFirstString = (item, keys) => {
  const key = keys.find(
    (candidate) => typeof item[candidate] === 'string' && item[candidate].trim(),
  );
  return key ? item[key] : undefined;
};

// 단일 공휴일 항목 정규화. date/name 둘 다 없으면 null(제외).
const adaptHolidayItem = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const date = normalizeDate(pickFirstString(item, DATE_KEYS));
  const name = pickFirstString(item, NAME_KEYS);

  if (!date || !name) {
    return null;
  }

  return {
    date,
    name: name.trim(),
  };
};

// payload 에서 공휴일 배열을 추출. 인식 불가 시 null.
const extractList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) {
      return payload.items;
    }

    if (Array.isArray(payload.holidays)) {
      return payload.holidays;
    }
  }

  return null;
};

/**
 * 외부 공휴일 API 응답(payload)을 [{ date: 'YYYY-MM-DD', name }] 형태로 정규화한다.
 * 배열 / { items: [...] } / { holidays: [...] } 형태를 지원하며,
 * 인식할 수 없는 형태이거나 항목이 비정상이면 빈 배열을 반환한다.
 *
 * @param {*} payload 외부 API 가 반환한 임의의 JSON 값
 * @returns {{ date: string, name: string }[]}
 */
const adaptHolidays = (payload) => {
  const list = extractList(payload);
  if (!list) {
    return [];
  }

  return list.map(adaptHolidayItem).filter((holiday) => holiday !== null);
};

module.exports = adaptHolidays;
