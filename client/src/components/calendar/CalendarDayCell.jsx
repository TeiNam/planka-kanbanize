/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { usePopup } from '../../lib/popup';
import { isSundayColumn, isHolidayDate, getLocalDateKey } from '../../utils/calendar';
import HolidayBadge from './HolidayBadge';
import CalendarEventItem from './CalendarEventItem';
import DueDateItem from './DueDateItem';
import CalendarEventPopup from './CalendarEventPopup';

import styles from './CalendarDayCell.module.scss';

// 월 그리드의 단일 날짜 셀.
// - 날짜 숫자는 일요일이면 항상 빨강(R2.3 / Correctness Property 5), 공휴일이어도 빨강(R10.3).
//   두 조건은 독립적으로 적용되며, 일요일 빨강은 공휴일 여부와 무관하다.
// - 현재 월에 속하지 않는 셀(inCurrentMonth === false)은 흐리게 표시한다.
// - 셀 내부에는 공휴일 배지 → 일정 → 마감일 카드 순으로 항목을 배치한다.
//
// 일정 생성/수정 팝업 통합(usePopup):
//   usePopup 은 트리거 엘리먼트를 감싸 그 위치에 팝업을 앵커링하므로, 셀 자체를 트리거로 삼아
//   CalendarEventPopup 을 셀에 통합한다. 셀 빈 영역 클릭 → 생성 모드(defaultDate=해당 날짜),
//   일정 항목 클릭 → 수정 모드(ref.open({ event })). 일정/마감일 항목은 stopPropagation 으로
//   셀(생성) 클릭과 분리된다. 마감일 항목 클릭은 onDueDateClick 으로 카드 열기에 위임한다(R8.3).
const CalendarDayCell = React.memo(
  ({ cell, holidays, events, dueDates, language, onDueDateClick }) => {
    const { date, day, inCurrentMonth, weekdayIndex } = cell;

    const isSunday = isSundayColumn(weekdayIndex);
    const isHoliday = isHolidayDate(holidays);
    const isToday = date === getLocalDateKey(new Date());

    const EventPopup = usePopup(CalendarEventPopup);
    const eventPopupRef = useRef(null);

    // 키보드(Enter/Space)로 셀에서 일정 생성을 시작한다. 마우스 클릭은 usePopup 트리거가 처리한다.
    const handleCellKeyDown = useCallback((domEvent) => {
      if (domEvent.key === 'Enter' || domEvent.key === ' ') {
        domEvent.preventDefault();

        if (eventPopupRef.current) {
          eventPopupRef.current.open();
        }
      }
    }, []);

    // 일정 항목 클릭 → 해당 일정을 수정 모드로 연다(R4). open 파라미터의 event 가 stepProps 의
    // defaultDate 보다 우선하여 수정 모드로 동작한다.
    const handleEventClick = useCallback((calendarEvent) => {
      if (eventPopupRef.current) {
        eventPopupRef.current.open({ event: calendarEvent });
      }
    }, []);

    return (
      <EventPopup ref={eventPopupRef} defaultDate={date}>
        <div
          className={classNames(styles.cell, !inCurrentMonth && styles.cellOutside)}
          role="button"
          tabIndex={0}
          onKeyDown={handleCellKeyDown}
        >
          <div
            className={classNames(
              styles.dayNumber,
              isSunday && styles.dayNumberSunday,
              isHoliday && styles.dayNumberHoliday,
              isToday && styles.dayNumberToday,
            )}
          >
            {day}
          </div>

          <div className={styles.items}>
            {holidays.map((holiday) => (
              <HolidayBadge key={`holiday-${holiday.date}-${holiday.name}`} name={holiday.name} />
            ))}

            {events.map((calendarEvent) => (
              <CalendarEventItem
                key={`event-${calendarEvent.id}`}
                event={calendarEvent}
                language={language}
                onClick={handleEventClick}
              />
            ))}

            {dueDates.map((card) => (
              <DueDateItem
                key={`due-${card.id}`}
                cardId={card.id}
                name={card.name}
                onClick={onDueDateClick}
              />
            ))}
          </div>
        </div>
      </EventPopup>
    );
  },
);

CalendarDayCell.propTypes = {
  /* eslint-disable react/forbid-prop-types */
  cell: PropTypes.object.isRequired,
  holidays: PropTypes.array.isRequired,
  events: PropTypes.array.isRequired,
  dueDates: PropTypes.array.isRequired,
  /* eslint-enable react/forbid-prop-types */
  language: PropTypes.string.isRequired,
  onDueDateClick: PropTypes.func,
};

CalendarDayCell.defaultProps = {
  onDueDateClick: undefined,
};

export default CalendarDayCell;
