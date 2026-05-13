/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import selectors from '../../../../selectors';

import styles from './BoardSummaryBar.module.scss';

const firstLine = (text) => {
  if (!text) return '';
  const trimmed = String(text).trim();
  const newlineIdx = trimmed.indexOf('\n');
  return newlineIdx === -1 ? trimmed : trimmed.slice(0, newlineIdx);
};

const BoardSummaryBar = React.memo(() => {
  const project = useSelector(selectors.selectCurrentProject);
  const board = useSelector(selectors.selectCurrentBoard);
  // Total WIP은 태스크 컬럼의 카드만 합산한다 (백로그/완료/디스카드 제외)
  const taskCardIds = useSelector(selectors.selectTaskCardIdsForCurrentBoard);

  if (!board) {
    return null;
  }

  const tagline = firstLine(project && project.description);
  const currentWip = taskCardIds ? taskCardIds.length : 0;
  const hasLimit = board.systemWipLimit !== null && board.systemWipLimit !== undefined;
  // 긴급 레인이 켜진 경우 Total WIP 분모에 expediteWipLimit를 더한다
  const expediteAllowance = board.isExpediteLaneEnabled ? board.expediteWipLimit || 1 : 0;
  const totalLimit = hasLimit ? Number(board.systemWipLimit) + expediteAllowance : null;
  const isExceeded = hasLimit && currentWip > totalLimit;

  return (
    <div className={styles.wrapper}>
      <div
        className={classNames(styles.totalWip, isExceeded && styles.totalWipExceeded)}
        title={hasLimit ? `Total WIP: ${currentWip}/${totalLimit}` : undefined}
      >
        <span className={styles.totalWipLabel}>Total WIP:</span>
        <span className={styles.totalWipValue}>
          {hasLimit ? `${currentWip}/${totalLimit}` : currentWip}
        </span>
      </div>
      <div className={styles.tagline} title={tagline}>
        {tagline}
      </div>
    </div>
  );
});

export default BoardSummaryBar;
