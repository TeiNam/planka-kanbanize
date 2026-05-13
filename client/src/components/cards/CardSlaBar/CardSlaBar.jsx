/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import selectors from '../../../selectors';

import styles from './CardSlaBar.module.scss';

// SLA 진행 바 컴포넌트
// 시작일~마감일 대비 현재 경과 비율을 시각화
// 녹색(≤80%), 주황색(80~100%), 빨간색(>100%)
const CardSlaBar = React.memo(({ cardId }) => {
  const selectSlaProgress = useMemo(() => selectors.makeSelectSlaProgress(), []);
  const slaProgress = useSelector((state) => selectSlaProgress(state, cardId));

  if (!slaProgress) {
    return null;
  }

  const { ratio, color } = slaProgress;
  const widthPercent = Math.min(ratio * 100, 100);

  return (
    <div className={styles.wrapper}>
      <div
        className={classNames(
          styles.bar,
          styles[`bar${color.charAt(0).toUpperCase() + color.slice(1)}`],
        )}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
});

CardSlaBar.propTypes = {
  cardId: PropTypes.string.isRequired,
};

export default CardSlaBar;
