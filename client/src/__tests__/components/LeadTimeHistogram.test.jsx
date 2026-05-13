/*!
 * LeadTimeHistogram 컴포넌트 단위 테스트
 * 히스토그램 렌더링, 85th percentile 기준선, 데이터 없을 때 빈 상태 표시 검증
 */

/* eslint-disable react/prop-types */
import React from 'react';
import { render, screen } from '@testing-library/react';

import LeadTimeHistogram from '../../components/metrics/LeadTimeHistogram/LeadTimeHistogram';

// Recharts 모킹
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey, fill }) => <div data-testid={`bar-${dataKey}`} data-fill={fill} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: ({ label }) => (
    <div data-testid="reference-line" data-label={label?.value || ''} />
  ),
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('LeadTimeHistogram', () => {
  const mockData = {
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 20],
    percentile85: 18,
    average: 9,
  };

  it('데이터가 null일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<LeadTimeHistogram data={null} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('values가 빈 배열일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<LeadTimeHistogram data={{ values: [], percentile85: 0, average: 0 }} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('유효한 데이터가 있을 때 차트를 렌더링해야 함', () => {
    render(<LeadTimeHistogram data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('bar-chart')).toBeTruthy();
  });

  it('Bar 컴포넌트가 렌더링되어야 함', () => {
    render(<LeadTimeHistogram data={mockData} />);

    expect(screen.getByTestId('bar-count')).toBeTruthy();
  });

  it('85th percentile 기준선이 렌더링되어야 함', () => {
    render(<LeadTimeHistogram data={mockData} />);

    const referenceLine = screen.getByTestId('reference-line');
    expect(referenceLine).toBeTruthy();
    expect(referenceLine.getAttribute('data-label')).toBe('85th: 18일');
  });

  it('축과 그리드가 렌더링되어야 함', () => {
    render(<LeadTimeHistogram data={mockData} />);

    expect(screen.getByTestId('x-axis')).toBeTruthy();
    expect(screen.getByTestId('y-axis')).toBeTruthy();
    expect(screen.getByTestId('cartesian-grid')).toBeTruthy();
  });

  it('Tooltip이 렌더링되어야 함', () => {
    render(<LeadTimeHistogram data={mockData} />);

    expect(screen.getByTestId('tooltip')).toBeTruthy();
  });

  it('단일 값 데이터도 정상 렌더링되어야 함', () => {
    const singleData = {
      values: [5],
      percentile85: 5,
      average: 5,
    };

    render(<LeadTimeHistogram data={singleData} />);

    expect(screen.getByTestId('bar-chart')).toBeTruthy();
    expect(screen.getByTestId('reference-line')).toBeTruthy();
  });
});
