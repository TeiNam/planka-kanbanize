/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

import styles from './LeadTimeHistogram.module.scss';

// 히스토그램 버킷 크기 (일 단위)
const BUCKET_SIZE = 2;

// Lead Time 히스토그램 컴포넌트
// 리드타임 분포를 시각화하고 85th percentile 기준선을 표시
const LeadTimeHistogram = React.memo(({ data }) => {
  const values = useMemo(() => data?.values || [], [data]);
  const percentile85 = data?.percentile85 || 0;

  // 히스토그램 버킷 생성
  const chartData = useMemo(() => {
    if (values.length === 0) return [];
    const maxValue = Math.max(...values);
    const bucketCount = Math.ceil(maxValue / BUCKET_SIZE) + 1;
    const buckets = [];

    for (let i = 0; i < bucketCount; i += 1) {
      const rangeStart = i * BUCKET_SIZE;
      const rangeEnd = rangeStart + BUCKET_SIZE;
      const count = values.filter((v) => v >= rangeStart && v < rangeEnd).length;

      buckets.push({
        range: `${rangeStart}-${rangeEnd}`,
        label: `${rangeStart}`,
        count,
        isOverSla: rangeStart >= percentile85,
      });
    }

    return buckets;
  }, [values, percentile85]);

  if (!data || values.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 30, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            label={{
              value: 'Lead Time (일)',
              position: 'insideBottom',
              offset: -18,
              fontSize: 12,
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            label={{ value: '카드 수', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [`${value}개`, '카드 수']}
            labelFormatter={(label) => `${label}~${Number(label) + BUCKET_SIZE}일`}
          />
          <ReferenceLine
            x={`${Math.floor(percentile85 / BUCKET_SIZE) * BUCKET_SIZE}`}
            stroke="#db2828"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `85th: ${percentile85}일`,
              position: 'top',
              fill: '#db2828',
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" fill="#4A90D9" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

LeadTimeHistogram.propTypes = {
  data: PropTypes.shape({
    values: PropTypes.arrayOf(PropTypes.number).isRequired,
    percentile85: PropTypes.number.isRequired,
    average: PropTypes.number,
  }),
};

LeadTimeHistogram.defaultProps = {
  data: null,
};

export default LeadTimeHistogram;
