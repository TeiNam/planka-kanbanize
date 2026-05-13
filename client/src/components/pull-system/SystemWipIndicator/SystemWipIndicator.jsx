/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import selectors from '../../../selectors';

import styles from './SystemWipIndicator.module.scss';

// 보드 레벨 전체 WIP 표시 컴포넌트
// "Total WIP: 현재수/제한값" 형식으로 보드 헤더에 표시
// 시스템 WIP 초과 시 빨간색 강조
const SystemWipIndicator = React.memo(({ boardId }) => {
  const board = useSelector((state) => selectors.selectBoardById(state, boardId));
  const filteredCardIds = useSelector(selectors.selectFilteredCardIdsForCurrentBoard);

  // systemWipLimit이 설정되지 않은 경우 표시하지 않음
  if (!board || board.systemWipLimit === null || board.systemWipLimit === undefined) {
    return null;
  }

  const currentWip = filteredCardIds ? filteredCardIds.length : 0;
  const isExceeded = currentWip > board.systemWipLimit;

  return (
    <div
      className={classNames(styles.wrapper, isExceeded && styles.wrapperExceeded)}
      title={
        isExceeded
          ? 'System WIP limit exceeded'
          : `Total WIP: ${currentWip}/${board.systemWipLimit}`
      }
    >
      <span className={styles.label}>Total WIP:</span>
      <span className={styles.value}>
        {currentWip}/{board.systemWipLimit}
      </span>
    </div>
  );
});

SystemWipIndicator.propTypes = {
  boardId: PropTypes.string.isRequired,
};

export default SystemWipIndicator;
