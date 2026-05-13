/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './LittleLawSummary.module.scss';

// 예상 Lead Time에 따른 색상 결정
// 녹색: 7일 이하, 주황색: 7~14일, 빨간색: 14일 초과
const getLeadTimeColorClass = (expectedLeadTime) => {
  if (expectedLeadTime === null) return styles.colorDefault;
  if (expectedLeadTime <= 7) return styles.colorGreen;
  if (expectedLeadTime <= 14) return styles.colorOrange;
  return styles.colorRed;
};

// Little's Law 요약 카드 컴포넌트
// 평균 WIP, 일 평균 Delivery Rate, 예상 Lead Time 표시
const LittleLawSummary = React.memo(({ summaryData }) => {
  if (!summaryData) {
    return (
      <div className={styles.wrapper}>
        <h4 className={styles.title}>Little&apos;s Law 요약</h4>
        <div className={styles.noData}>데이터가 없습니다</div>
      </div>
    );
  }

  const { avgWip, deliveryRate, expectedLeadTime } = summaryData;

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.title}>Little&apos;s Law 요약</h4>
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={classNames(styles.metricValue, styles.colorDefault)}>{avgWip}</span>
          <span className={styles.metricLabel}>평균 WIP</span>
          <span className={styles.metricUnit}>카드</span>
        </div>
        <div className={styles.metricCard}>
          <span className={classNames(styles.metricValue, styles.colorDefault)}>
            {deliveryRate}
          </span>
          <span className={styles.metricLabel}>일 평균 Delivery Rate</span>
          <span className={styles.metricUnit}>건/일</span>
        </div>
        <div className={styles.metricCard}>
          <span className={classNames(styles.metricValue, getLeadTimeColorClass(expectedLeadTime))}>
            {expectedLeadTime !== null ? expectedLeadTime : '-'}
          </span>
          <span className={styles.metricLabel}>예상 Lead Time</span>
          <span className={styles.metricUnit}>일</span>
        </div>
      </div>
      <div className={styles.formula}>Predicted Lead Time = Avg WIP / Avg Delivery Rate</div>
    </div>
  );
});

LittleLawSummary.propTypes = {
  summaryData: PropTypes.shape({
    avgWip: PropTypes.number.isRequired,
    deliveryRate: PropTypes.number.isRequired,
    expectedLeadTime: PropTypes.number,
  }),
};

LittleLawSummary.defaultProps = {
  summaryData: null,
};

export default LittleLawSummary;
