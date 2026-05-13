/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import selectors from '../../../selectors';

import styles from './WipLimitIndicator.module.scss';

// 컬럼 헤더에 "현재수/제한값" 형식으로 WIP 상태를 표시하는 컴포넌트
// WIP 제한 미설정 시 렌더링하지 않음
// WIP 초과 시 빨간색 배경으로 경고 표시
const WipLimitIndicator = React.memo(({ listId }) => {
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);
  const selectWipCount = useMemo(() => selectors.makeSelectWipCount(), []);

  const list = useSelector((state) => selectListById(state, listId));
  const wipCount = useSelector((state) => selectWipCount(state, listId));

  // WIP 제한이 설정되지 않은 경우 표시하지 않음
  if (!list || list.wipLimit === null || list.wipLimit === undefined) {
    return null;
  }

  const isExceeded = wipCount > list.wipLimit;

  return (
    <span
      className={classNames(styles.wrapper, isExceeded && styles.wrapperExceeded)}
      title={isExceeded ? 'WIP limit exceeded' : `WIP Limit ${wipCount}/${list.wipLimit}`}
    >
      <span className={styles.label}>WIP Limit</span>
      <span className={styles.value}>
        {wipCount}/{list.wipLimit}
      </span>
    </span>
  );
});

WipLimitIndicator.propTypes = {
  listId: PropTypes.string.isRequired,
};

export default WipLimitIndicator;
