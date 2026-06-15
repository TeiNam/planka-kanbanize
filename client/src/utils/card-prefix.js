/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// 카드 말머리(prefix) 폭 계산/검증 유틸. 서버 server/utils/card-prefix.js 와 규칙이 동일해야 한다.
// 폭 규칙: 한글(및 호환 자모)은 2, 그 외(영문/숫자)는 1. 최대 허용 폭은 4.

export const MAX_PREFIX_WIDTH = 4;

const HANGUL_REGEX = /[\uAC00-\uD7A3\u3130-\u318F\u1100-\u11FF]/;
const PREFIX_ALLOWED_REGEX = /^[A-Za-z0-9\uAC00-\uD7A3\u3130-\u318F]+$/;

export const getCardPrefixWidth = (value) =>
  Array.from(value || '').reduce((width, ch) => width + (HANGUL_REGEX.test(ch) ? 2 : 1), 0);

export const isCardPrefix = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  if (value === '') {
    return true;
  }

  if (!PREFIX_ALLOWED_REGEX.test(value)) {
    return false;
  }

  return getCardPrefixWidth(value) <= MAX_PREFIX_WIDTH;
};

export default {
  MAX_PREFIX_WIDTH,
  getCardPrefixWidth,
  isCardPrefix,
};
