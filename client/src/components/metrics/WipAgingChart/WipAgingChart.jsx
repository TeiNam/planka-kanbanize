/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

import styles from './WipAgingChart.module.scss';

// 나이에 따른 색상 결정
// 녹색: 5일 미만, 노란색: 5~10일, 빨간색: 10일 초과
const getAgingColor = (ageDays) => {
  if (ageDays < 5) return '#21ba45';
  if (ageDays <= 10) return '#fbbd08';
  return '#db2828';
};

// 커스텀 툴팁 컴포넌트
function WipAgingTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p>
        <strong>{data.cardName}</strong>
      </p>
      <p>체류 일수: {data.ageDays}일</p>
      <p>컬럼: {data.listName}</p>
    </div>
  );
}

WipAgingTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        cardName: PropTypes.string,
        ageDays: PropTypes.number,
        listName: PropTypes.string,
      }),
    }),
  ),
};

WipAgingTooltip.defaultProps = {
  active: false,
  payload: [],
};

// WIP Aging Chart 컴포넌트
// 컬럼별 현재 진행 카드의 체류 일수를 산점도로 표시
const WipAgingChart = React.memo(({ wipAgingData, lists }) => {
  // 리스트 ID → 이름 매핑 및 인덱스 부여
  const listMap = useMemo(() => {
    const map = {};
    if (lists) {
      lists.forEach((list, index) => {
        map[list.id] = { name: list.name, index };
      });
    }
    return map;
  }, [lists]);

  // 차트 데이터 구성
  const chartData = useMemo(
    () =>
      (wipAgingData || []).map((item) => {
        const listInfo = listMap[item.listId] || { name: 'Unknown', index: 0 };
        return {
          ...item,
          listName: listInfo.name,
          listIndex: listInfo.index,
        };
      }),
    [wipAgingData, listMap],
  );

  // X축 틱 값 (컬럼 인덱스)
  const xTicks = useMemo(() => {
    if (!lists) return [];
    return lists.map((_, index) => index);
  }, [lists]);

  // X축 틱 포맷터 (인덱스 → 컬럼 이름)
  const formatXTick = (index) => {
    if (!lists || !lists[index]) return '';
    const { name } = lists[index];
    return name.length > 10 ? `${name.substring(0, 10)}...` : name;
  };

  if (!wipAgingData || wipAgingData.length === 0) {
    return (
      <div className={styles.wrapper}>
        <h4 className={styles.title}>WIP Aging Chart</h4>
        <div className={styles.noData}>데이터가 없습니다</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.title}>WIP Aging Chart</h4>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey="listIndex"
            domain={[0, lists ? lists.length - 1 : 0]}
            ticks={xTicks}
            tickFormatter={formatXTick}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="ageDays"
            label={{ value: '체류 일수', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<WipAgingTooltip />} />
          <Scatter name="카드" data={chartData}>
            {chartData.map((entry) => (
              <Cell key={entry.cardId} fill={getAgingColor(entry.ageDays)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className={styles.legendWrapper}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#21ba45' }} />
          &lt; 5일
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#fbbd08' }} />
          5~10일
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#db2828' }} />
          &gt; 10일
        </span>
      </div>
    </div>
  );
});

WipAgingChart.propTypes = {
  wipAgingData: PropTypes.arrayOf(
    PropTypes.shape({
      cardId: PropTypes.string.isRequired,
      cardName: PropTypes.string.isRequired,
      listId: PropTypes.string.isRequired,
      ageDays: PropTypes.number.isRequired,
    }),
  ),
  lists: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
};

WipAgingChart.defaultProps = {
  wipAgingData: null,
  lists: null,
};

export default WipAgingChart;
