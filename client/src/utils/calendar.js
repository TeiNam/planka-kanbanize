/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * 캘린더 월 그리드 및 날짜 그룹핑 유틸 (순수 함수, React 비의존)
 *
 * ── 이중 날짜키 규칙 (중요) ──────────────────────────────────────────────
 * 캘린더에서 날짜 셀을 결정하는 규칙은 일정 종류에 따라 다르다.
 *
 *  1) All_Day_Event (하루 종일):  UTC date 성분으로 날짜키를 추출한다.
 *     - all-day 일정은 UTC 자정 경계로 저장된다(R7.5). 뷰어의 로컬 타임존에
 *       따라 날짜가 하루 밀려 보이는 버그를 막기 위해, 날짜키는 항상 UTC
 *       기준(`toISOString().slice(0, 10)`)으로 뽑는다. 로컬 `getDate()` 금지.
 *     → getAllDayDateKey / getAllDayDateKeys 사용.
 *
 *  2) Time_Based_Event (시간 단위):  로컬 date 성분으로 날짜키를 추출한다.
 *     - time-based 일정의 시각은 뷰어 로컬 타임존으로 입력·표시된다(R7.6/7.7).
 *       따라서 어느 날짜 셀에 배치할지도 로컬 `getFullYear/getMonth/getDate`
 *       기준으로 결정한다.
 *     → getLocalDateKey 사용.
 *
 *  두 규칙의 날짜키 추출 방식이 다르다는 점에 반드시 주의할 것.
 * ─────────────────────────────────────────────────────────────────────────
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 무한 루프 방지를 위한 다일 확장 상한(여유 있는 안전값)
const MAX_RANGE_DAYS = 1000;

// 한 주의 칸 수(일~토)
const DAYS_PER_WEEK = 7;

// 두 자리 0 패딩
const pad2 = (value) => String(value).padStart(2, '0');

// 입력을 Date 로 정규화하고, 유효하지 않으면 null 반환
const toValidDate = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// UTC date 성분(자정)으로 정규화한 타임스탬프 반환
const toUtcMidnightTime = (date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/**
 * 일요일 시작 월 그리드를 생성한다.
 *
 * @param {number} year   4자리 연도 (예: 2026)
 * @param {number} month  0-indexed 월 (0 = 1월 … 11 = 12월, JS Date 규약)
 * @returns {Array<Array<{date: string, day: number, inCurrentMonth: boolean, weekdayIndex: number}>>}
 *   주(week) 배열의 배열. 각 주는 일요일~토요일 7개 셀을 가진다(R2.1, R2.2).
 *   선행/후행 셀은 인접한 달의 날짜로 채워 주를 완성한다(월 경계 채움).
 *   날짜 계산은 타임존 영향을 받지 않도록 UTC 기준으로 수행한다.
 */
export const generateMonthGrid = (year, month) => {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));

  // 해당 월 1일의 요일(0=일요일) 만큼 이전 달 날짜로 선행 채움
  const leadingDays = firstOfMonth.getUTCDay();

  // 해당 월의 일수 (다음 달 0일 = 이번 달 말일)
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  // 전체 셀 수를 7의 배수로 올림하여 후행 채움 포함
  const totalCells = Math.ceil((leadingDays + daysInMonth) / DAYS_PER_WEEK) * DAYS_PER_WEEK;

  // 그리드 시작일 = 1일에서 선행 일수만큼 뒤로
  const startTime = toUtcMidnightTime(firstOfMonth) - leadingDays * MS_PER_DAY;

  const weeks = [];
  for (let weekIndex = 0; weekIndex < totalCells / DAYS_PER_WEEK; weekIndex += 1) {
    const week = [];

    for (let dayInWeek = 0; dayInWeek < DAYS_PER_WEEK; dayInWeek += 1) {
      const cellIndex = weekIndex * DAYS_PER_WEEK + dayInWeek;
      const cellDate = new Date(startTime + cellIndex * MS_PER_DAY);

      week.push({
        date: cellDate.toISOString().slice(0, 10),
        day: cellDate.getUTCDate(),
        inCurrentMonth: cellDate.getUTCMonth() === month && cellDate.getUTCFullYear() === year,
        weekdayIndex: cellDate.getUTCDay(),
      });
    }

    weeks.push(week);
  }

  return weeks;
};

/**
 * All_Day_Event 의 날짜키(YYYY-MM-DD)를 UTC date 성분으로 추출한다(R7.5).
 * 타임존 독립적이어야 하므로 항상 `toISOString().slice(0, 10)` 기준이다.
 *
 * @param {string|number|Date} value ISO 문자열, 타임스탬프 또는 Date
 * @returns {string|null} 'YYYY-MM-DD' 또는 유효하지 않으면 null
 */
export const getAllDayDateKey = (value) => {
  const date = toValidDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

/**
 * 다일 All_Day_Event 를 시작~종료(포함) 각 날짜키로 확장한다(R7.4).
 * UTC date 경계로 하루씩 스테핑한다.
 *
 * @param {string|number|Date} startValue 시작 시점
 * @param {string|number|Date} endValue   종료 시점
 * @returns {string[]} 'YYYY-MM-DD' 키 배열. 유효하지 않거나 종료<시작이면 [].
 */
export const getAllDayDateKeys = (startValue, endValue) => {
  const startDate = toValidDate(startValue);
  const endDate = toValidDate(endValue);

  if (!startDate || !endDate) {
    return [];
  }

  const startTime = toUtcMidnightTime(startDate);
  const endTime = toUtcMidnightTime(endDate);

  if (endTime < startTime) {
    return [];
  }

  const keys = [];
  for (
    let time = startTime, guard = 0;
    time <= endTime && guard < MAX_RANGE_DAYS;
    time += MS_PER_DAY, guard += 1
  ) {
    keys.push(new Date(time).toISOString().slice(0, 10));
  }

  return keys;
};

/**
 * Time_Based_Event 의 날짜키(YYYY-MM-DD)를 로컬 date 성분으로 추출한다(R7.6).
 * 셀 배치를 뷰어 로컬 타임존 기준으로 하기 위해 getFullYear/getMonth/getDate 사용.
 *
 * @param {string|number|Date} value ISO 문자열, 타임스탬프 또는 Date
 * @returns {string|null} 'YYYY-MM-DD' 또는 유효하지 않으면 null
 */
export const getLocalDateKey = (value) => {
  const date = toValidDate(value);

  if (!date) {
    return null;
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

/**
 * 항목 목록을 날짜키(YYYY-MM-DD)별로 그룹핑한다.
 *
 * keyExtractor 는 단일 키(string) 또는 키 배열(string[])을 반환할 수 있다.
 * - all-day 단일/마감일/공휴일: getAllDayDateKey 등 단일 키 추출기 전달.
 * - 다일 all-day: getAllDayDateKeys 처럼 배열을 반환하는 추출기를 전달하면
 *   각 날짜 셀에 동일 항목이 펼쳐진다.
 * - time-based: getLocalDateKey 추출기 전달.
 * null/undefined/빈 키는 그룹에서 제외한다.
 *
 * @template T
 * @param {T[]} items 그룹핑할 항목들
 * @param {(item: T) => (string|null|undefined|Array<string|null|undefined>)} keyExtractor
 * @returns {Object<string, T[]>} 날짜키 → 항목 배열
 */
export const groupByDateKey = (items, keyExtractor) => {
  const result = {};

  items.forEach((item) => {
    const extracted = keyExtractor(item);
    const keys = Array.isArray(extracted) ? extracted : [extracted];

    keys.forEach((key) => {
      if (!key) {
        return;
      }

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(item);
    });
  });

  return result;
};

/**
 * 날짜 숫자를 적색으로 표시할지 결정하는 순수 판정 헬퍼들.
 *
 * 적색 판정은 두 조건이 독립적으로 적용된다(둘 다 빨강 토큰):
 *  - 일요일(weekdayIndex === 0): 공휴일 여부와 무관하게 항상 적색
 *    (R2.3 / Correctness Property 5 — 일요일 적색 불변식).
 *  - 공휴일(해당 날짜에 공휴일이 1개 이상): 적색 (R10.3).
 *
 * CalendarDayCell 이 두 헬퍼를 사용해 dayNumberSunday / dayNumberHoliday
 * 클래스를 각각 부여한다. 인라인 비교 대신 명시적 순수 함수로 분리하여
 * 단위 테스트와 의미 전달을 용이하게 한다.
 */

/**
 * 일요일 열 여부 (R2.3 / Property 5).
 * @param {number} weekdayIndex 0=일요일 … 6=토요일
 * @returns {boolean} 일요일이면 true
 */
export const isSundayColumn = (weekdayIndex) => weekdayIndex === 0;

/**
 * 공휴일 날짜 여부 (R10.3).
 * @param {Array} holidays 해당 날짜의 공휴일 목록
 * @returns {boolean} 공휴일이 1개 이상이면 true
 */
export const isHolidayDate = (holidays) => Array.isArray(holidays) && holidays.length > 0;

/**
 * 날짜 숫자 적색 표시 여부 (일요일 또는 공휴일).
 * 일요일은 공휴일 여부와 무관하게 항상 적색이다.
 * @param {number} weekdayIndex 0=일요일 … 6=토요일
 * @param {Array} holidays 해당 날짜의 공휴일 목록
 * @returns {boolean} 적색으로 표시해야 하면 true
 */
export const isRedDayNumber = (weekdayIndex, holidays) =>
  isSundayColumn(weekdayIndex) || isHolidayDate(holidays);
