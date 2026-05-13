/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';

import styles from './PullSlot.module.scss';

// 빈 슬롯을 점선 카드 형태로 표시하여 새 작업을 당겨올 수 있음을 시각화
// count만큼 빈 슬롯 플레이스홀더를 렌더링
const PullSlot = React.memo(({ count }) => {
  if (!count || count <= 0) {
    return null;
  }

  // 최대 5개까지만 표시하여 UI 과부하 방지
  const displayCount = Math.min(count, 5);

  return (
    <div className={styles.wrapper}>
      {}
      {Array.from({ length: displayCount }, (_, index) => (
        <div key={index} className={styles.slot}>
          <div className={styles.slotInner} />
        </div>
      ))}
      {count > 5 && <div className={styles.moreIndicator}>+{count - 5}</div>}
    </div>
  );
});

PullSlot.propTypes = {
  count: PropTypes.number.isRequired,
};

export default PullSlot;
