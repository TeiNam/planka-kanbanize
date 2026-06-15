/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// 카드 말머리(prefix) 관련 공통 유틸.
// 폭 계산 규칙: 한글(및 호환 자모)은 폭 2, 그 외(영문/숫자)는 폭 1. 최대 허용 폭은 4.
// 즉 한글 2자(2+2=4) 또는 영문/숫자 4자(1*4=4)까지 허용한다.

const MAX_PREFIX_WIDTH = 4;

// 한글 음절(가-힣) + 호환 자모(ㄱ-ㅎ, ㅏ-ㅣ 등)
const HANGUL_REGEX = /[\uAC00-\uD7A3\u3130-\u318F\u1100-\u11FF]/;

// 허용 문자: 영문/숫자/한글만. 공백·대괄호 등 형식을 깨는 문자는 불가.
const PREFIX_ALLOWED_REGEX = /^[A-Za-z0-9\uAC00-\uD7A3\u3130-\u318F]+$/;

// 문자열의 폭(한글 2, 그 외 1)을 계산한다.
const getPrefixWidth = (value) =>
  Array.from(value).reduce((width, ch) => width + (HANGUL_REGEX.test(ch) ? 2 : 1), 0);

// 말머리 문자열 유효성 검사. 빈 문자열은 "미설정"으로 간주해 허용한다.
const isCardPrefix = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  if (value === '') {
    return true;
  }

  if (!PREFIX_ALLOWED_REGEX.test(value)) {
    return false;
  }

  return getPrefixWidth(value) <= MAX_PREFIX_WIDTH;
};

// 순번 포맷: 10 미만은 2자리 0 패딩(01~09), 그 이상은 그대로(10, 11, ...).
const formatPrefixNumber = (number) => (number < 10 ? `0${number}` : String(number));

// 말머리와 순번을 카드명 앞에 부착한다. 예: "[DB-01] 카드 제목"
const buildPrefixedName = (prefix, number, name) =>
  `[${prefix}-${formatPrefixNumber(number)}] ${name}`;

module.exports = {
  MAX_PREFIX_WIDTH,
  getPrefixWidth,
  isCardPrefix,
  formatPrefixNumber,
  buildPrefixedName,
};
