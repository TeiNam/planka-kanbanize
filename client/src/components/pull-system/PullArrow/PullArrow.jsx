/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import selectors from '../../../selectors';

import styles from './PullArrow.module.scss';

// 컬럼 간 Pull 방향 화살표 (오른쪽에서 왼쪽 방향: ←)
// 다음 컬럼(오른쪽)에 빈 슬롯이 있을 때만 표시
const PullArrow = React.memo(({ nextListId }) => {
  const selectEmptySlots = useMemo(() => selectors.makeSelectEmptySlots(), []);

  const emptySlots = useSelector((state) => selectEmptySlots(state, nextListId));

  // 다음 컬럼에 빈 슬롯이 없으면 화살표 표시하지 않음
  if (!emptySlots || emptySlots <= 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.arrow}>
        <span className={styles.arrowHead}>←</span>
      </div>
    </div>
  );
});

PullArrow.propTypes = {
  nextListId: PropTypes.string.isRequired,
};

export default PullArrow;
