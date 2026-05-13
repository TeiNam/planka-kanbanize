/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import styles from './CfdChart.module.scss';

// 컬럼별 기본 색상 팔레트
const DEFAULT_COLORS = [
  '#4A90D9',
  '#F5A623',
  '#7ED321',
  '#D0021B',
  '#9013FE',
  '#50E3C2',
  '#B8E986',
  '#F8E71C',
  '#BD10E0',
  '#417505',
];

// 날짜 포맷 (MM/DD)
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

// CFD (Cumulative Flow Diagram) 차트 컴포넌트
// 일 단위 시간축 기반으로 각 컬럼별 누적 카드 수 변화를 시각화
const CfdChart = React.memo(({ data }) => {
  if (!data || !data.lists || data.lists.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>데이터가 없습니다</p>
      </div>
    );
  }

  const { dates, lists } = data;

  // Recharts용 데이터 변환: 날짜별 각 컬럼의 카드 수를 포함하는 객체 배열
  const chartData = dates.map((date, index) => {
    const entry = { date };
    lists.forEach((list) => {
      entry[list.name] = list.counts[index] || 0;
    });
    return entry;
  });

  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatDate} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip labelFormatter={formatDate} />
          <Legend />
          {lists.map((list, index) => (
            <Area
              key={list.listId}
              type="monotone"
              dataKey={list.name}
              stackId="1"
              stroke={list.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              fill={list.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

CfdChart.propTypes = {
  data: PropTypes.shape({
    dates: PropTypes.arrayOf(PropTypes.string).isRequired,
    lists: PropTypes.arrayOf(
      PropTypes.shape({
        listId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string,
        counts: PropTypes.arrayOf(PropTypes.number).isRequired,
      }),
    ).isRequired,
  }),
};

CfdChart.defaultProps = {
  data: null,
};

export default CfdChart;
