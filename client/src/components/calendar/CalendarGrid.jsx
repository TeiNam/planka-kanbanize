/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import CalendarDayCell from './CalendarDayCell';

import styles from './CalendarGrid.module.scss';

// 일요일 시작 요일 헤더 기준일 (2024-01-07 은 일요일)
const WEEKDAY_REFERENCE_SUNDAY = new Date(2024, 0, 7);

// 월 단위 7열 그리드. 상단에 일요일 시작 요일 헤더(R2.2)를, 그 아래에 주(week)별로
// CalendarDayCell 을 배치한다. 일요일/공휴일 빨강(R2.3/R10.3)과 셀 내부 항목 렌더,
// 일정 생성/수정 팝업은 CalendarDayCell 이 담당한다. 마감일 카드 클릭(카드 열기)은
// onDueDateClick 으로 위임받아 셀에 전달한다(R8.3).
const CalendarGrid = React.memo(
  ({ weeks, eventsByDateKey, dueDatesByDateKey, holidaysByDateKey, language, onDueDateClick }) => {
    // 일요일(인덱스 0)부터 토요일까지의 요일 라벨을 뷰어 로컬 로케일로 생성한다.
    const weekdayLabels = useMemo(() => {
      const labels = [];
      const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });

      for (let i = 0; i < 7; i += 1) {
        const date = new Date(WEEKDAY_REFERENCE_SUNDAY);
        date.setDate(WEEKDAY_REFERENCE_SUNDAY.getDate() + i);
        labels.push(formatter.format(date));
      }

      return labels;
    }, [language]);

    return (
      <div className={styles.grid}>
        <div className={styles.weekdayRow}>
          {weekdayLabels.map((label, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className={classNames(styles.weekdayCell, index === 0 && styles.weekdayCellSunday)}
            >
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week) => (
          <div key={week[0].date} className={styles.weekRow}>
            {week.map((cell) => (
              <CalendarDayCell
                key={cell.date}
                cell={cell}
                holidays={holidaysByDateKey[cell.date] || []}
                events={eventsByDateKey[cell.date] || []}
                dueDates={dueDatesByDateKey[cell.date] || []}
                language={language}
                onDueDateClick={onDueDateClick}
              />
            ))}
          </div>
        ))}
      </div>
    );
  },
);

CalendarGrid.propTypes = {
  /* eslint-disable react/forbid-prop-types */
  weeks: PropTypes.array.isRequired,
  eventsByDateKey: PropTypes.object.isRequired,
  dueDatesByDateKey: PropTypes.object.isRequired,
  holidaysByDateKey: PropTypes.object.isRequired,
  /* eslint-enable react/forbid-prop-types */
  language: PropTypes.string.isRequired,
  onDueDateClick: PropTypes.func,
};

CalendarGrid.defaultProps = {
  onDueDateClick: undefined,
};

export default CalendarGrid;
