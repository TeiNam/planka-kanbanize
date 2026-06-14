/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';

import styles from './CalendarItems.module.scss';

// 셀 내부의 공휴일 배지(명칭)를 렌더한다 (R8.2 / R10.2). 일정/마감일 항목과 구분되는
// 별도 스타일(빨강 계열, scss)을 사용한다. 공휴일 날짜 숫자 빨강 처리(R10.3)는
// CalendarDayCell 이 담당하며, 여기서는 셀 내부의 공휴일 명칭 배지만 표시한다.
const HolidayBadge = React.memo(({ name }) => {
  return (
    <div className={styles.holidayBadge} title={name}>
      {name}
    </div>
  );
});

HolidayBadge.propTypes = {
  name: PropTypes.string.isRequired,
};

export default HolidayBadge;
