/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Icon } from 'semantic-ui-react';

import selectors from '../../../selectors';

import styles from './CardBlockerBadge.module.scss';

// 블로커 사유 텍스트 최대 30자 표시
const MAX_REASON_LENGTH = 30;

const truncateReason = (reason) => {
  if (!reason) {
    return '';
  }

  if (reason.length <= MAX_REASON_LENGTH) {
    return reason;
  }

  return `${reason.slice(0, MAX_REASON_LENGTH)}...`;
};

const CardBlockerBadge = React.memo(({ cardId }) => {
  const selectActiveBlockerCount = useMemo(() => selectors.makeSelectActiveBlockerCount(), []);
  const selectBlockersByCardId = useMemo(() => selectors.makeSelectBlockersByCardId(), []);

  const activeCount = useSelector((state) => selectActiveBlockerCount(state, cardId));
  const blockers = useSelector((state) => selectBlockersByCardId(state, cardId));

  // 활성 블로커가 없으면 렌더링하지 않음
  if (!activeCount || activeCount === 0) {
    return null;
  }

  // 첫 번째 활성 블로커의 사유 텍스트 표시
  const activeBlockers = blockers ? blockers.filter((b) => b.status === 'active') : [];
  const firstReason = activeBlockers.length > 0 ? activeBlockers[0].reason : '';

  return (
    <span className={styles.wrapper}>
      <Icon name="ban" className={styles.icon} />
      <span className={styles.count}>{activeCount}</span>
      {firstReason && <span className={styles.reason}>{truncateReason(firstReason)}</span>}
    </span>
  );
});

CardBlockerBadge.propTypes = {
  cardId: PropTypes.string.isRequired,
};

export default CardBlockerBadge;
