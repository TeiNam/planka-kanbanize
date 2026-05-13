/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './PullableCardHighlight.module.scss';

// Pull 가능 카드에 시각적 강조 표시를 적용하는 래퍼 컴포넌트
// isPullable이 true일 때 미묘한 글로우/보더 효과 적용
const PullableCardHighlight = React.memo(({ isPullable, children }) => (
  <div className={classNames(styles.wrapper, isPullable && styles.wrapperPullable)}>{children}</div>
));

PullableCardHighlight.propTypes = {
  isPullable: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default PullableCardHighlight;
