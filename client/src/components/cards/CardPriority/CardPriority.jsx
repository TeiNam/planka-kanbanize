/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './CardPriority.module.scss';

const PRIORITY_STYLES = {
  H: 'badgeHigh',
  M: 'badgeMedium',
  L: 'badgeLow',
};

// 우선순위 문자 배지 컴포넌트
// H=빨간색, M=주황색, L=파란색 원형 배지
const CardPriority = React.memo(({ priority }) => {
  if (!priority || !PRIORITY_STYLES[priority]) {
    return null;
  }

  return (
    <span className={classNames(styles.badge, styles[PRIORITY_STYLES[priority]])}>{priority}</span>
  );
});

CardPriority.propTypes = {
  priority: PropTypes.oneOf(['H', 'M', 'L']),
};

CardPriority.defaultProps = {
  priority: undefined,
};

export default CardPriority;
