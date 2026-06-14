/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { CalendarEventKinds } from '../../constants/Enums';

import styles from './CalendarItems.module.scss';

// 시각 라벨 구분 기호(en dash) — "HH:mm–HH:mm"
const TIME_RANGE_SEPARATOR = '\u2013';

// 캘린더 셀 내부의 일정 항목.
// - All_Day_Event: 시각 라벨 없이 제목만 표시한다 (R7.2).
// - Time_Based_Event: 시작~종료 시각을 뷰어 로컬 타임존으로 포매팅해 제목과 함께 표시한다 (R7.3/R7.6).
//   로컬 타임존 표시는 브라우저 Date 의 로컬 메서드 기반 Intl.DateTimeFormat 으로 처리하며 UTC 로 표시하지 않는다.
// - 마감일 카드(DueDateItem)와 시각적으로 구분되도록 종류별 modifier 클래스를 부여한다 (R8.2).
// - 클릭(또는 Enter/Space) 시 onClick(event) 으로 해당 일정 객체를 상위로 전달해 수정 팝업을 연다.
//   셀 빈 영역 클릭(생성)으로 전파되지 않도록 stopPropagation 한다.
const CalendarEventItem = React.memo(({ event, language, onClick }) => {
  const { name, eventKind, startAt, endAt } = event;

  const isTimeBased = eventKind === CalendarEventKinds.TIME_BASED;

  // 로컬 타임존 기준 시:분 포매터 (언어/로케일 종속, R7.6)
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [language],
  );

  // time-based 일정의 시작~종료 시각 라벨(로컬). all-day 는 라벨 없음(R7.2).
  const timeLabel = useMemo(() => {
    if (!isTimeBased) {
      return null;
    }

    const startDate = startAt ? new Date(startAt) : null;
    const endDate = endAt ? new Date(endAt) : null;

    const isStartValid = startDate && !Number.isNaN(startDate.getTime());
    const isEndValid = endDate && !Number.isNaN(endDate.getTime());

    if (!isStartValid && !isEndValid) {
      return null;
    }

    const startText = isStartValid ? timeFormatter.format(startDate) : '';
    const endText = isEndValid ? timeFormatter.format(endDate) : '';

    if (startText && endText) {
      return `${startText}${TIME_RANGE_SEPARATOR}${endText}`;
    }

    return startText || endText;
  }, [isTimeBased, startAt, endAt, timeFormatter]);

  const handleClick = useCallback(
    (domEvent) => {
      // 셀(일정 생성) 클릭으로 전파되지 않도록 차단한다.
      domEvent.stopPropagation();

      if (onClick) {
        onClick(event);
      }
    },
    [event, onClick],
  );

  // 접근성: role="button" 이므로 Enter/Space 로도 수정 팝업을 열 수 있게 한다.
  const handleKeyDown = useCallback(
    (domEvent) => {
      if (domEvent.key === 'Enter' || domEvent.key === ' ') {
        domEvent.preventDefault();
        handleClick(domEvent);
      }
    },
    [handleClick],
  );

  return (
    <div
      className={classNames(
        styles.eventItem,
        isTimeBased ? styles.eventItemTimeBased : styles.eventItemAllDay,
      )}
      title={name}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {timeLabel && <span className={styles.eventTime}>{timeLabel}</span>}
      <span className={styles.eventName}>{name}</span>
    </div>
  );
});

CalendarEventItem.propTypes = {
  /* eslint-disable-next-line react/forbid-prop-types */
  event: PropTypes.object.isRequired,
  language: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

CalendarEventItem.defaultProps = {
  onClick: undefined,
};

export default CalendarEventItem;
