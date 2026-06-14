/*!
 * 날짜 숫자 적색 판정 헬퍼 단위 테스트
 *
 * 검증 범위 (CalendarDayCell 의 빨강 판정 로직):
 * - isSundayColumn: 일요일(weekdayIndex===0)이면 항상 true (R2.3 / Correctness Property 5)
 * - isHolidayDate: 공휴일이 1개 이상이면 true (R10.3)
 * - isRedDayNumber: 일요일이거나 공휴일이면 적색. 일요일은 공휴일 여부와 무관하게 항상 적색.
 */

import { isSundayColumn, isHolidayDate, isRedDayNumber } from '../../utils/calendar';

describe('isSundayColumn (R2.3 / Property 5)', () => {
  it('weekdayIndex 0(일요일)이면 true 를 반환해야 함', () => {
    expect(isSundayColumn(0)).toBe(true);
  });

  it('월~토(1..6)는 false 를 반환해야 함', () => {
    [1, 2, 3, 4, 5, 6].forEach((index) => {
      expect(isSundayColumn(index)).toBe(false);
    });
  });
});

describe('isHolidayDate (R10.3)', () => {
  it('공휴일이 1개 이상이면 true 를 반환해야 함', () => {
    expect(isHolidayDate([{ date: '2026-06-06', name: 'Memorial Day' }])).toBe(true);
  });

  it('공휴일이 없으면 false 를 반환해야 함', () => {
    expect(isHolidayDate([])).toBe(false);
  });

  it('배열이 아닌 입력은 false 를 반환해야 함', () => {
    expect(isHolidayDate(undefined)).toBe(false);
    expect(isHolidayDate(null)).toBe(false);
  });
});

describe('isRedDayNumber (일요일 또는 공휴일 → 적색)', () => {
  it('일요일은 공휴일이 없어도 항상 적색이어야 함 (Property 5)', () => {
    expect(isRedDayNumber(0, [])).toBe(true);
  });

  it('일요일은 공휴일이 있어도 적색이어야 함', () => {
    expect(isRedDayNumber(0, [{ date: '2026-06-07', name: 'Holiday' }])).toBe(true);
  });

  it('평일이라도 공휴일이면 적색이어야 함 (R10.3)', () => {
    expect(isRedDayNumber(3, [{ date: '2026-06-10', name: 'Holiday' }])).toBe(true);
  });

  it('평일이고 공휴일도 아니면 적색이 아니어야 함', () => {
    expect(isRedDayNumber(3, [])).toBe(false);
  });

  it('토요일은 공휴일이 없으면 적색이 아니어야 함', () => {
    expect(isRedDayNumber(6, [])).toBe(false);
  });
});
