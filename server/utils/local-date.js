/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// 메트릭 집계 타임존 정책: "서버 프로세스의 로컬 타임존" 기준.
// 운영자는 TZ 환경변수(예: TZ=Asia/Seoul)로 집계 기준일을 제어한다. 미설정 시 UTC(기존 동작).
// 스냅샷 날짜 라벨, 주간 버킷, 달력일 계산이 모두 이 유틸을 사용해야 서로 어긋나지 않는다.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Date → 로컬 타임존 기준 'YYYY-MM-DD' 문자열
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 'YYYY-MM-DD'(또는 ISO 문자열의 날짜부) → 로컬 자정 Date
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

// 해당 날짜의 로컬 자정(그 날의 시작) Date
const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// 로컬 달력 기준 일수 더하기 (DST 경계에서도 달력일 단위로 안전)
const addLocalDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// 'YYYY-MM-DD' 가 가리키는 로컬 하루의 마지막 밀리초 (endOfDay)
const endOfLocalDayMs = (dateStr) => addLocalDays(parseLocalDate(dateStr), 1).getTime() - 1;

// 두 시점 사이의 로컬 달력일 차이 (같은 날 = 0). DST 로 하루가 23/25시간이어도 반올림으로 보정.
const diffLocalCalendarDays = (from, to) =>
  Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / MS_PER_DAY);

module.exports = {
  formatLocalDate,
  parseLocalDate,
  startOfLocalDay,
  addLocalDays,
  endOfLocalDayMs,
  diffLocalCalendarDays,
};
