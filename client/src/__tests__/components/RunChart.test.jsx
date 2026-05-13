/*!
 * RunChart 컴포넌트 단위 테스트
 * Run Chart 렌더링, 데이터 없을 때 빈 상태 표시, Lead Time 산점도 + Throughput 라인 검증
 */

/* eslint-disable react/prop-types */
import React from 'react';
import { render, screen } from '@testing-library/react';

import RunChart from '../../components/metrics/RunChart/RunChart';

// Recharts 모킹 - SVG 렌더링 대신 간단한 DOM 요소로 대체
jest.mock('recharts', () => ({
  ComposedChart: ({ children }) => <div data-testid="composed-chart">{children}</div>,
  Scatter: ({ name, dataKey }) => <div data-testid={`scatter-${name}`} data-key={dataKey} />,
  Line: ({ name, dataKey }) => <div data-testid={`line-${name}`} data-key={dataKey} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ yAxisId }) => <div data-testid={`y-axis-${yAxisId}`} />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('RunChart', () => {
  const mockLeadTimeData = {
    values: [3, 5, 7, 2, 10, 4],
    percentile85: 9,
    average: 5,
  };

  const mockThroughputData = {
    weeks: ['2025-01-06', '2025-01-13', '2025-01-20'],
    counts: [4, 6, 3],
  };

  it('두 데이터가 모두 null일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<RunChart leadTimeData={null} throughputData={null} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('leadTimeData만 있을 때 차트를 렌더링해야 함', () => {
    render(<RunChart leadTimeData={mockLeadTimeData} throughputData={null} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('composed-chart')).toBeTruthy();
    expect(screen.getByTestId('scatter-Lead Time')).toBeTruthy();
  });

  it('throughputData만 있을 때 차트를 렌더링해야 함', () => {
    render(<RunChart leadTimeData={null} throughputData={mockThroughputData} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('composed-chart')).toBeTruthy();
    expect(screen.getByTestId('line-Throughput')).toBeTruthy();
  });

  it('두 데이터가 모두 있을 때 Scatter와 Line을 모두 렌더링해야 함', () => {
    render(<RunChart leadTimeData={mockLeadTimeData} throughputData={mockThroughputData} />);

    expect(screen.getByTestId('scatter-Lead Time')).toBeTruthy();
    expect(screen.getByTestId('line-Throughput')).toBeTruthy();
  });

  it('Scatter의 dataKey가 leadTime이어야 함', () => {
    render(<RunChart leadTimeData={mockLeadTimeData} throughputData={mockThroughputData} />);

    expect(screen.getByTestId('scatter-Lead Time').getAttribute('data-key')).toBe('leadTime');
  });

  it('Line의 dataKey가 throughput이어야 함', () => {
    render(<RunChart leadTimeData={mockLeadTimeData} throughputData={mockThroughputData} />);

    expect(screen.getByTestId('line-Throughput').getAttribute('data-key')).toBe('throughput');
  });

  it('이중 Y축이 렌더링되어야 함 (left, right)', () => {
    render(<RunChart leadTimeData={mockLeadTimeData} throughputData={mockThroughputData} />);

    expect(screen.getByTestId('y-axis-left')).toBeTruthy();
    expect(screen.getByTestId('y-axis-right')).toBeTruthy();
  });

  it('타이틀이 Run Chart로 표시되어야 함', () => {
    render(<RunChart leadTimeData={mockLeadTimeData} throughputData={mockThroughputData} />);

    expect(screen.getByText('Run Chart')).toBeTruthy();
  });
});
