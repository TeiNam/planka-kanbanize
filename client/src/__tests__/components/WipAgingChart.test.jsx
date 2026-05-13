/*!
 * WipAgingChart 컴포넌트 단위 테스트
 * WIP Aging 차트 렌더링, 데이터 없을 때 빈 상태 표시, 색상 코딩 검증
 */

/* eslint-disable react/prop-types */
import React from 'react';
import { render, screen } from '@testing-library/react';

import WipAgingChart from '../../components/metrics/WipAgingChart/WipAgingChart';

// Recharts 모킹
jest.mock('recharts', () => ({
  ScatterChart: ({ children }) => <div data-testid="scatter-chart">{children}</div>,
  Scatter: ({ children, data }) => (
    <div data-testid="scatter" data-count={data ? data.length : 0}>
      {children}
    </div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Cell: ({ fill }) => <div data-testid="cell" data-fill={fill} />,
}));

describe('WipAgingChart', () => {
  const mockLists = [
    { id: 'list-1', name: 'Backlog' },
    { id: 'list-2', name: 'In Progress' },
    { id: 'list-3', name: 'Review' },
  ];

  const mockWipAgingData = [
    { cardId: 'card-1', cardName: 'Task A', listId: 'list-2', ageDays: 3 },
    { cardId: 'card-2', cardName: 'Task B', listId: 'list-2', ageDays: 7 },
    { cardId: 'card-3', cardName: 'Task C', listId: 'list-3', ageDays: 12 },
  ];

  it('데이터가 null일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<WipAgingChart wipAgingData={null} lists={mockLists} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('데이터가 빈 배열일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<WipAgingChart wipAgingData={[]} lists={mockLists} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('유효한 데이터가 있을 때 차트를 렌더링해야 함', () => {
    render(<WipAgingChart wipAgingData={mockWipAgingData} lists={mockLists} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('scatter-chart')).toBeTruthy();
  });

  it('카드 수만큼 Cell을 렌더링해야 함', () => {
    render(<WipAgingChart wipAgingData={mockWipAgingData} lists={mockLists} />);

    const cells = screen.getAllByTestId('cell');
    expect(cells).toHaveLength(3);
  });

  it('나이에 따라 올바른 색상을 적용해야 함 (녹색 < 5일)', () => {
    render(<WipAgingChart wipAgingData={mockWipAgingData} lists={mockLists} />);

    const cells = screen.getAllByTestId('cell');
    // card-1: 3일 → 녹색
    expect(cells[0].getAttribute('data-fill')).toBe('#21ba45');
  });

  it('나이에 따라 올바른 색상을 적용해야 함 (노란색 5~10일)', () => {
    render(<WipAgingChart wipAgingData={mockWipAgingData} lists={mockLists} />);

    const cells = screen.getAllByTestId('cell');
    // card-2: 7일 → 노란색
    expect(cells[1].getAttribute('data-fill')).toBe('#fbbd08');
  });

  it('나이에 따라 올바른 색상을 적용해야 함 (빨간색 > 10일)', () => {
    render(<WipAgingChart wipAgingData={mockWipAgingData} lists={mockLists} />);

    const cells = screen.getAllByTestId('cell');
    // card-3: 12일 → 빨간색
    expect(cells[2].getAttribute('data-fill')).toBe('#db2828');
  });

  it('범례가 표시되어야 함', () => {
    render(<WipAgingChart wipAgingData={mockWipAgingData} lists={mockLists} />);

    expect(screen.getByText('< 5일')).toBeTruthy();
    expect(screen.getByText('5~10일')).toBeTruthy();
    expect(screen.getByText('> 10일')).toBeTruthy();
  });

  it('타이틀이 WIP Aging Chart로 표시되어야 함', () => {
    render(<WipAgingChart wipAgingData={mockWipAgingData} lists={mockLists} />);

    expect(screen.getByText('WIP Aging Chart')).toBeTruthy();
  });
});
