/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import {
  generateMonthGrid,
  getAllDayDateKey,
  getAllDayDateKeys,
  getLocalDateKey,
  groupByDateKey,
} from './calendar';

// 비-UTC 타임존에서도 동작이 안정적임을 보이기 위해 의도적으로 UTC가 아닌 타임존을 설정한다.
// (all-day 키 추출은 UTC 기반이라 TZ와 무관하게 동일해야 하고,
//  time-based 키 추출은 로컬 구성/추출이 대칭이라 TZ와 무관하게 일관돼야 한다.)
// calendar 모듈은 import 시 TZ를 읽지 않으므로 import 이후 설정해도 테스트 실행 전 반영된다.
process.env.TZ = 'America/New_York';

describe('generateMonthGrid', () => {
  // 2023-01-01 은 일요일(잘 알려진 기준일) → 선행 채움이 없는 달
  describe('월의 1일이 일요일인 경우 (2023년 1월, month=0)', () => {
    const weeks = generateMonthGrid(2023, 0);

    test('각 주는 7개의 셀을 가진다', () => {
      weeks.forEach((week) => {
        expect(week).toHaveLength(7);
      });
    });

    test('5주로 구성된다 (선행 0 + 31일 → 35셀)', () => {
      expect(weeks).toHaveLength(5);
    });

    test('첫 셀은 1월 1일이며 일요일(weekdayIndex 0)이고 현재 월에 속한다', () => {
      expect(weeks[0][0]).toEqual({
        date: '2023-01-01',
        day: 1,
        inCurrentMonth: true,
        weekdayIndex: 0,
      });
    });

    test('각 열의 weekdayIndex 는 일요일(0)부터 토요일(6) 순서다', () => {
      weeks.forEach((week) => {
        week.forEach((cell, columnIndex) => {
          expect(cell.weekdayIndex).toBe(columnIndex);
        });
      });
    });

    test('월 말일(1월 31일)이 현재 월 셀로 존재한다', () => {
      const lastDayCell = weeks.flat().find((cell) => cell.date === '2023-01-31');
      expect(lastDayCell).toBeDefined();
      expect(lastDayCell.inCurrentMonth).toBe(true);
      expect(lastDayCell.day).toBe(31);
    });

    test('마지막 셀은 다음 달(2월)에서 채워지며 현재 월이 아니다', () => {
      const lastCell = weeks[weeks.length - 1][6];
      expect(lastCell.date).toBe('2023-02-04');
      expect(lastCell.inCurrentMonth).toBe(false);
    });
  });

  // 2023-07-01 은 토요일 → 선행 6일(6월 25~30) 채움
  describe('월의 1일이 토요일인 경우 (2023년 7월, month=6)', () => {
    const weeks = generateMonthGrid(2023, 6);

    test('6주로 구성된다 (선행 6 + 31일 → 42셀)', () => {
      expect(weeks).toHaveLength(6);
    });

    test('첫 셀은 이전 달(6월 25일, 일요일)이며 현재 월이 아니다', () => {
      expect(weeks[0][0]).toEqual({
        date: '2023-06-25',
        day: 25,
        inCurrentMonth: false,
        weekdayIndex: 0,
      });
    });

    test('7월 1일은 첫 주 토요일(index 6) 위치에 배치되고 현재 월이다', () => {
      expect(weeks[0][6]).toEqual({
        date: '2023-07-01',
        day: 1,
        inCurrentMonth: true,
        weekdayIndex: 6,
      });
    });

    test('월 말일(7월 31일)이 현재 월 셀로 존재한다', () => {
      const lastDayCell = weeks.flat().find((cell) => cell.date === '2023-07-31');
      expect(lastDayCell).toBeDefined();
      expect(lastDayCell.inCurrentMonth).toBe(true);
    });
  });

  test('연도 경계: 2024년 12월 그리드는 다음 해 1월로 후행 채움된다', () => {
    const weeks = generateMonthGrid(2024, 11);
    const trailing = weeks.flat().find((cell) => cell.date === '2025-01-01');
    expect(trailing).toBeDefined();
    expect(trailing.inCurrentMonth).toBe(false);
  });
});

describe('getAllDayDateKey (all-day → UTC date 성분)', () => {
  test('UTC 자정 ISO 문자열의 날짜 성분을 반환한다', () => {
    expect(getAllDayDateKey('2026-06-15T00:00:00.000Z')).toBe('2026-06-15');
  });

  test('비-UTC 타임존에서도 날짜가 밀리지 않는다 (R7.5)', () => {
    // all-day 일정은 UTC 자정으로 저장된다. America/New_York(UTC-4/5)에서
    // 로컬 getDate()를 쓰면 6월 14일로 하루 밀리지만, UTC 기반 추출은 항상 6월 15일.
    expect(getAllDayDateKey('2026-06-15T00:00:00.000Z')).toBe('2026-06-15');
  });

  test('오프셋이 포함된 ISO 는 UTC 로 환산한 날짜를 반환한다', () => {
    // 2026-06-15T08:30:00+09:00 === 2026-06-14T23:30:00Z → UTC 날짜는 06-14
    expect(getAllDayDateKey('2026-06-15T08:30:00+09:00')).toBe('2026-06-14');
  });

  test('Date 객체 입력도 지원한다', () => {
    expect(getAllDayDateKey(new Date('2026-06-15T00:00:00.000Z'))).toBe('2026-06-15');
  });

  test('유효하지 않은 입력은 null 을 반환한다', () => {
    expect(getAllDayDateKey('not-a-date')).toBeNull();
    expect(getAllDayDateKey(null)).toBeNull();
    expect(getAllDayDateKey(undefined)).toBeNull();
  });
});

describe('getAllDayDateKeys (다일 all-day 확장, UTC 스테핑)', () => {
  test('시작~종료 날짜를 포함하여 각 날짜 키로 확장한다 (R7.4)', () => {
    expect(getAllDayDateKeys('2026-06-15T00:00:00.000Z', '2026-06-18T00:00:00.000Z')).toEqual([
      '2026-06-15',
      '2026-06-16',
      '2026-06-17',
      '2026-06-18',
    ]);
  });

  test('단일 날짜(시작=종료)는 키 1개를 반환한다', () => {
    expect(getAllDayDateKeys('2026-06-15T00:00:00.000Z', '2026-06-15T00:00:00.000Z')).toEqual([
      '2026-06-15',
    ]);
  });

  test('월 경계를 넘는 다일 일정도 올바르게 확장한다', () => {
    expect(getAllDayDateKeys('2026-01-30T00:00:00.000Z', '2026-02-02T00:00:00.000Z')).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
    ]);
  });

  test('종료가 시작보다 빠르면 빈 배열을 반환한다', () => {
    expect(getAllDayDateKeys('2026-06-18T00:00:00.000Z', '2026-06-15T00:00:00.000Z')).toEqual([]);
  });

  test('유효하지 않은 입력은 빈 배열을 반환한다', () => {
    expect(getAllDayDateKeys('bad', '2026-06-15T00:00:00.000Z')).toEqual([]);
  });
});

describe('getLocalDateKey (time-based → 로컬 date 성분)', () => {
  test('로컬 구성요소로 만든 Date 의 로컬 날짜를 반환한다 (R7.6)', () => {
    // 로컬로 구성하고 로컬로 추출하므로 런타임 타임존과 무관하게 대칭적으로 일관된다.
    const localDate = new Date(2026, 5, 15, 14, 30); // 2026-06-15 14:30 local
    expect(getLocalDateKey(localDate)).toBe('2026-06-15');
  });

  test('월/일을 0 패딩한다', () => {
    const localDate = new Date(2026, 0, 3, 9, 5); // 2026-01-03 local
    expect(getLocalDateKey(localDate)).toBe('2026-01-03');
  });

  test('유효하지 않은 입력은 null 을 반환한다', () => {
    expect(getLocalDateKey('not-a-date')).toBeNull();
    expect(getLocalDateKey(null)).toBeNull();
  });
});

describe('이중 날짜키 규칙 대비 (all-day=UTC vs time-based=local)', () => {
  test('동일 인스턴트라도 추출 규칙이 다르면 날짜키가 달라질 수 있다', () => {
    // 2026-06-15T02:00:00Z → America/New_York(UTC-4) 로컬은 2026-06-14 22:00
    const iso = '2026-06-15T02:00:00.000Z';
    // all-day 규칙: UTC 날짜
    expect(getAllDayDateKey(iso)).toBe('2026-06-15');
    // time-based 규칙: 로컬 날짜 (뉴욕 기준 하루 전).
    // 런타임 TZ 변경이 적용되지 않는 환경(UTC 등)을 대비해 두 값 중 하나임을 허용한다.
    expect(['2026-06-14', '2026-06-15']).toContain(getLocalDateKey(new Date(iso)));
  });
});

describe('groupByDateKey', () => {
  test('단일 키 추출기로 항목을 날짜별로 그룹핑한다', () => {
    const items = [
      { id: 'a', dueDate: '2026-06-15T00:00:00.000Z' },
      { id: 'b', dueDate: '2026-06-15T00:00:00.000Z' },
      { id: 'c', dueDate: '2026-06-16T00:00:00.000Z' },
    ];

    const grouped = groupByDateKey(items, (item) => getAllDayDateKey(item.dueDate));

    expect(grouped['2026-06-15'].map((item) => item.id)).toEqual(['a', 'b']);
    expect(grouped['2026-06-16'].map((item) => item.id)).toEqual(['c']);
  });

  test('배열 키 추출기(다일 all-day)는 각 날짜 셀에 항목을 펼친다', () => {
    const items = [
      { id: 'multi', startAt: '2026-06-15T00:00:00.000Z', endAt: '2026-06-17T00:00:00.000Z' },
    ];

    const grouped = groupByDateKey(items, (item) => getAllDayDateKeys(item.startAt, item.endAt));

    expect(grouped['2026-06-15']).toHaveLength(1);
    expect(grouped['2026-06-16']).toHaveLength(1);
    expect(grouped['2026-06-17']).toHaveLength(1);
    expect(grouped['2026-06-15'][0].id).toBe('multi');
  });

  test('빈 입력은 빈 객체를 반환한다', () => {
    expect(groupByDateKey([], () => null)).toEqual({});
  });

  test('null 키는 그룹에서 제외한다', () => {
    const items = [{ id: 'x', dueDate: null }];
    const grouped = groupByDateKey(items, (item) => getAllDayDateKey(item.dueDate));
    expect(grouped).toEqual({});
  });
});
