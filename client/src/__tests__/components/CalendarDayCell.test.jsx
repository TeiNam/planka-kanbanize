/*!
 * CalendarDayCell 컴포넌트 단위 테스트
 *
 * 검증 범위:
 * - 날짜 숫자 및 셀 내부 항목(공휴일 배지 / 일정 / 마감일 카드) 렌더링 (R2.1, R8.1)
 * - all-day 일정: 시각 라벨 없이 제목만 표시 (R7.2)
 * - time-based 일정: 시작~종료 시각 라벨을 함께 표시 (R7.3 / 로컬 타임존 표시 R7.6)
 * - 마감일 카드 클릭 시 onDueDateClick(cardId) 호출 (R8.3)
 *
 * NOTE:
 * - scss 모듈은 Jest 에서 문자열 스텁으로 모킹되어 클래스명이 해석되지 않으므로
 *   일요일/공휴일 빨강(R2.3/R10.3)은 className 단언이 아닌 구조/동작 중심으로 검증한다.
 * - 일정 생성/수정 팝업은 usePopup 으로 셀에 통합되므로(Semantic UI Popup), 다른 컴포넌트
 *   테스트(SwimLaneHeader)와 동일하게 lib/popup 을 모킹해 트리거(children)만 렌더한다.
 *   time-based 시각 라벨은 타임존 의존을 피하기 위해 정확한 값 대신 "HH:MM" 패턴 유무로 검증한다.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import CalendarDayCell from '../../components/calendar/CalendarDayCell';
import { CalendarEventKinds } from '../../constants/Enums';

// popup 라이브러리 모킹: usePopup 은 트리거(children)만 렌더한다. 전달된 ref 는 무시하며,
// CalendarDayCell 의 핸들러는 ref.current(null) 가드가 있어 안전하다.
jest.mock('../../lib/popup', () => {
  // eslint-disable-next-line global-require
  const ReactModule = require('react');

  return {
    usePopup: () => ReactModule.forwardRef(({ children }) => children),
  };
});

const baseCell = {
  date: '2026-06-14',
  day: 14,
  inCurrentMonth: true,
  weekdayIndex: 0, // 일요일
};

const renderCell = (props = {}) =>
  render(
    <CalendarDayCell
      cell={baseCell}
      holidays={[]}
      events={[]}
      dueDates={[]}
      language="en"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />,
  );

// "HH:MM" 형태의 시각 라벨 존재 여부 (타임존/로케일 독립적인 패턴 검증)
const TIME_LABEL_PATTERN = /\d{1,2}:\d{2}/;

describe('CalendarDayCell', () => {
  it('날짜 숫자를 렌더링해야 함', () => {
    const { getByText } = renderCell();

    expect(getByText('14')).toBeTruthy();
  });

  it('공휴일 명칭을 렌더링해야 함 (R10.2)', () => {
    const { getByText } = renderCell({
      holidays: [{ date: '2026-06-14', name: 'Memorial Day' }],
    });

    expect(getByText('Memorial Day')).toBeTruthy();
  });

  it('all-day 일정은 시각 라벨 없이 제목만 표시해야 함 (R7.2)', () => {
    const { getByText, container } = renderCell({
      events: [
        {
          id: 'e1',
          name: 'Team Offsite',
          eventKind: CalendarEventKinds.ALL_DAY,
          startAt: '2026-06-14T00:00:00.000Z',
          endAt: '2026-06-14T00:00:00.000Z',
        },
      ],
    });

    expect(getByText('Team Offsite')).toBeTruthy();
    // all-day 는 시각 라벨이 없어야 한다.
    expect(container.textContent).not.toMatch(TIME_LABEL_PATTERN);
  });

  it('time-based 일정은 시작~종료 시각 라벨을 함께 표시해야 함 (R7.3/R7.6)', () => {
    const { getByText, container } = renderCell({
      events: [
        {
          id: 'e2',
          name: 'Standup',
          eventKind: CalendarEventKinds.TIME_BASED,
          startAt: '2026-06-14T09:00:00.000Z',
          endAt: '2026-06-14T10:00:00.000Z',
        },
      ],
    });

    expect(getByText('Standup')).toBeTruthy();
    // time-based 는 "HH:MM" 형태의 시각 라벨이 표시되어야 한다(로컬 타임존 포매팅).
    expect(container.textContent).toMatch(TIME_LABEL_PATTERN);
  });

  it('마감일 카드 이름을 렌더링해야 함 (R8.1)', () => {
    const { getByText } = renderCell({
      dueDates: [{ id: 'c1', name: 'Ship release', dueDate: '2026-06-14T00:00:00.000Z' }],
    });

    expect(getByText('Ship release')).toBeTruthy();
  });

  it('마감일 카드 클릭 시 onDueDateClick 을 cardId 와 함께 호출해야 함 (R8.3)', () => {
    const onDueDateClick = jest.fn();
    const { getByText } = renderCell({
      onDueDateClick,
      dueDates: [{ id: 'c1', name: 'Ship release', dueDate: '2026-06-14T00:00:00.000Z' }],
    });

    fireEvent.click(getByText('Ship release'));

    expect(onDueDateClick).toHaveBeenCalledWith('c1');
  });
});
