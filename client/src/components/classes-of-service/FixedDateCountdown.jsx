/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import styles from './FixedDateCountdown.module.scss';

// Fixed_Date CoS 카드의 남은 일수 카운트다운 표시
// "D-N" 형식으로 표시, 초과 시 빨간색
const FixedDateCountdown = React.memo(({ dueDate }) => {
  const { daysRemaining, isOverdue } = useMemo(() => {
    if (!dueDate) {
      return { daysRemaining: null, isOverdue: false };
    }

    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      daysRemaining: diffDays,
      isOverdue: diffDays < 0,
    };
  }, [dueDate]);

  if (daysRemaining === null) {
    return null;
  }

  const displayText = isOverdue ? `D+${Math.abs(daysRemaining)}` : `D-${daysRemaining}`;

  return (
    <span className={`${styles.countdown} ${isOverdue ? styles.countdownOverdue : ''}`}>
      {displayText}
    </span>
  );
});

FixedDateCountdown.propTypes = {
  dueDate: PropTypes.string,
};

FixedDateCountdown.defaultProps = {
  dueDate: null,
};

export default FixedDateCountdown;
