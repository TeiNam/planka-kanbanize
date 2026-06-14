/*!
 * 캘린더 날짜키 타임존 불변성 테스트 (R7.5)
 *
 * Task 22 의 calendar.test.js 는 America/New_York(UTC-) 기준으로 검증했다.
 * 본 파일은 보완으로, 테스트 타임존을 비-UTC(Asia/Seoul, UTC+9)로 고정했을 때
 * all-day 날짜키가 밀리지 않음을 검증한다. all-day 키 추출은 UTC date 성분
 * 기반이므로 런타임 타임존과 무관하게 동일해야 한다.
 *
 * NOTE: process.env.TZ 는 모듈 import 이전(파일 최상단)에서 설정해야 Date 구현에 반영된다.
 */

process.env.TZ = 'Asia/Seoul';

// eslint-disable-next-line import/first
import { getAllDayDateKey, getAllDayDateKeys, groupByDateKey } from '../../utils/calendar';

describe('all-day 날짜키 타임존 불변성 (TZ=Asia/Seoul, R7.5)', () => {
  it('UTC 자정 all-day 일정의 날짜키가 KST 에서도 밀리지 않아야 함', () => {
    // KST(UTC+9)에서도 UTC date 기준이면 항상 06-15 로 유지된다.
    expect(getAllDayDateKey('2026-06-15T00:00:00.000Z')).toBe('2026-06-15');
  });

  it('월 말일 UTC 자정 일정이 다음 날로 밀리지 않아야 함', () => {
    expect(getAllDayDateKey('2026-06-30T00:00:00.000Z')).toBe('2026-06-30');
  });

  it('연말 UTC 자정 일정이 다음 해로 밀리지 않아야 함', () => {
    expect(getAllDayDateKey('2026-12-31T00:00:00.000Z')).toBe('2026-12-31');
  });

  it('다일 all-day 확장도 KST 에서 동일하게 UTC 경계로 스테핑되어야 함', () => {
    expect(getAllDayDateKeys('2026-06-30T00:00:00.000Z', '2026-07-02T00:00:00.000Z')).toEqual([
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
    ]);
  });

  it('마감일 카드 그룹핑도 KST 에서 입력 날짜에 그대로 매칭되어야 함', () => {
    const cards = [
      { id: 'c1', dueDate: '2026-06-15T00:00:00.000Z' },
      { id: 'c2', dueDate: '2026-06-15T00:00:00.000Z' },
      { id: 'c3', dueDate: '2026-06-16T00:00:00.000Z' },
    ];

    const grouped = groupByDateKey(cards, (card) => getAllDayDateKey(card.dueDate));

    expect(grouped['2026-06-15'].map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(grouped['2026-06-16'].map((c) => c.id)).toEqual(['c3']);
    // KST 로 하루 밀린 키(06-14)는 생성되지 않아야 한다.
    expect(grouped['2026-06-14']).toBeUndefined();
  });
});
