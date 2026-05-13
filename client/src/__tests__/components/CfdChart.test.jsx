/*!
 * CfdChart 컴포넌트 단위 테스트
 * CFD 차트 렌더링, 데이터 없을 때 빈 상태 표시, 컬럼별 색상 밴드 검증
 */

/* eslint-disable react/prop-types */
import React from 'react';
import { render, screen } from '@testing-library/react';

import CfdChart from '../../components/metrics/CfdChart/CfdChart';

// Recharts 모킹 - SVG 렌더링 대신 간단한 DOM 요소로 대체
jest.mock('recharts', () => ({
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: ({ dataKey, fill }) => <div data-testid={`area-${dataKey}`} data-fill={fill} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('CfdChart', () => {
  const mockData = {
    dates: ['2025-01-01', '2025-01-02', '2025-01-03'],
    lists: [
      {
        listId: 'list-1',
        name: 'Backlog',
        color: '#4A90D9',
        counts: [10, 11, 12],
      },
      {
        listId: 'list-2',
        name: 'In Progress',
        color: '#F5A623',
        counts: [3, 4, 3],
      },
      {
        listId: 'list-3',
        name: 'Done',
        color: '#7ED321',
        counts: [5, 6, 8],
      },
    ],
  };

  it('데이터가 null일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<CfdChart data={null} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('lists가 빈 배열일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<CfdChart data={{ dates: [], lists: [] }} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('유효한 데이터가 있을 때 차트를 렌더링해야 함', () => {
    render(<CfdChart data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('area-chart')).toBeTruthy();
  });

  it('각 컬럼에 대해 Area 컴포넌트를 렌더링해야 함', () => {
    render(<CfdChart data={mockData} />);

    expect(screen.getByTestId('area-Backlog')).toBeTruthy();
    expect(screen.getByTestId('area-In Progress')).toBeTruthy();
    expect(screen.getByTestId('area-Done')).toBeTruthy();
  });

  it('각 Area에 올바른 색상이 적용되어야 함', () => {
    render(<CfdChart data={mockData} />);

    expect(screen.getByTestId('area-Backlog').getAttribute('data-fill')).toBe('#4A90D9');
    expect(screen.getByTestId('area-In Progress').getAttribute('data-fill')).toBe('#F5A623');
    expect(screen.getByTestId('area-Done').getAttribute('data-fill')).toBe('#7ED321');
  });

  it('축과 그리드가 렌더링되어야 함', () => {
    render(<CfdChart data={mockData} />);

    expect(screen.getByTestId('x-axis')).toBeTruthy();
    expect(screen.getByTestId('y-axis')).toBeTruthy();
    expect(screen.getByTestId('cartesian-grid')).toBeTruthy();
  });

  it('Tooltip과 Legend가 렌더링되어야 함', () => {
    render(<CfdChart data={mockData} />);

    expect(screen.getByTestId('tooltip')).toBeTruthy();
    expect(screen.getByTestId('legend')).toBeTruthy();
  });

  it('색상이 지정되지 않은 컬럼에 기본 색상이 적용되어야 함', () => {
    const dataWithoutColors = {
      dates: ['2025-01-01'],
      lists: [{ listId: 'list-1', name: 'Column A', counts: [5] }],
    };

    render(<CfdChart data={dataWithoutColors} />);

    const area = screen.getByTestId('area-Column A');
    expect(area.getAttribute('data-fill')).toBe('#4A90D9');
  });
});
