/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import styles from './RunChart.module.scss';

// 커스텀 툴팁 컴포넌트
function RunChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value !== null ? entry.value : '-'}
          {entry.name === 'Lead Time' ? '일' : '건/주'}
        </p>
      ))}
    </div>
  );
}

RunChartTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.shape({})),
};

RunChartTooltip.defaultProps = {
  active: false,
  payload: [],
};

// Run Chart 컴포넌트
// 완료된 카드의 Lead Time을 점으로, 주 단위 Throughput을 선으로 표시
const RunChart = React.memo(({ leadTimeData, throughputData }) => {
  if (!leadTimeData && !throughputData) {
    return (
      <div className={styles.wrapper}>
        <h4 className={styles.title}>Run Chart</h4>
        <div className={styles.noData}>데이터가 없습니다</div>
      </div>
    );
  }

  // Lead Time 산점도 데이터 구성
  const scatterData = leadTimeData
    ? leadTimeData.values.map((leadTime, index) => ({
        index,
        leadTime,
      }))
    : [];

  // Throughput 라인 데이터 구성
  const lineData = throughputData
    ? throughputData.weeks.map((week, index) => ({
        week,
        throughput: throughputData.counts[index],
      }))
    : [];

  // 두 데이터를 합쳐서 ComposedChart에 사용
  const maxLength = Math.max(scatterData.length, lineData.length);
  const composedData = Array.from({ length: maxLength }, (_, i) => ({
    index: i,
    leadTime: scatterData[i] ? scatterData[i].leadTime : null,
    throughput: lineData[i] ? lineData[i].throughput : null,
    week: lineData[i] ? lineData[i].week : null,
  }));

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.title}>Run Chart</h4>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={composedData} margin={{ top: 10, right: 40, left: 10, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="index"
            label={{
              value: '완료 순서',
              position: 'insideBottom',
              offset: -38,
              fontSize: 12,
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            label={{
              value: 'Lead Time (일)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fontSize: 12,
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'Throughput (건/주)',
              angle: 90,
              position: 'insideRight',
              offset: 10,
              fontSize: 12,
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<RunChartTooltip />} />
          <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 8, bottom: 0 }} />
          <Scatter
            yAxisId="left"
            name="Lead Time"
            dataKey="leadTime"
            fill="#4A90D9"
            shape="circle"
            r={4}
          />
          <Line
            yAxisId="right"
            name="Throughput"
            dataKey="throughput"
            stroke="#F5A623"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

RunChart.propTypes = {
  leadTimeData: PropTypes.shape({
    values: PropTypes.arrayOf(PropTypes.number).isRequired,
    percentile85: PropTypes.number,
    average: PropTypes.number,
  }),
  throughputData: PropTypes.shape({
    weeks: PropTypes.arrayOf(PropTypes.string).isRequired,
    counts: PropTypes.arrayOf(PropTypes.number).isRequired,
  }),
};

RunChart.defaultProps = {
  leadTimeData: null,
  throughputData: null,
};

export default RunChart;
