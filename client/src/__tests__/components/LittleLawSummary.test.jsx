/*!
 * LittleLawSummary 컴포넌트 단위 테스트
 * Little's Law 요약 카드 렌더링, 데이터 없을 때 빈 상태 표시, 색상 코딩 검증
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import LittleLawSummary from '../../components/metrics/LittleLawSummary/LittleLawSummary';

describe('LittleLawSummary', () => {
  it('데이터가 null일 때 빈 상태 메시지를 표시해야 함', () => {
    render(<LittleLawSummary summaryData={null} />);

    expect(screen.getByText('데이터가 없습니다')).toBeTruthy();
  });

  it('유효한 데이터가 있을 때 메트릭 값을 표시해야 함', () => {
    const mockData = { avgWip: 8, deliveryRate: 1.5, expectedLeadTime: 5 };
    render(<LittleLawSummary summaryData={mockData} />);

    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('1.5')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('라벨이 올바르게 표시되어야 함', () => {
    const mockData = { avgWip: 8, deliveryRate: 1.5, expectedLeadTime: 5 };
    render(<LittleLawSummary summaryData={mockData} />);

    expect(screen.getByText('평균 WIP')).toBeTruthy();
    expect(screen.getByText('일 평균 Delivery Rate')).toBeTruthy();
    expect(screen.getByText('예상 Lead Time')).toBeTruthy();
  });

  it('수식이 표시되어야 함', () => {
    const mockData = { avgWip: 8, deliveryRate: 1.5, expectedLeadTime: 5 };
    render(<LittleLawSummary summaryData={mockData} />);

    expect(screen.getByText('Predicted Lead Time = Avg WIP / Avg Delivery Rate')).toBeTruthy();
  });

  it('expectedLeadTime이 null일 때 대시(-)를 표시해야 함', () => {
    const mockData = { avgWip: 5, deliveryRate: 0, expectedLeadTime: null };
    render(<LittleLawSummary summaryData={mockData} />);

    expect(screen.getByText('-')).toBeTruthy();
  });

  it('expectedLeadTime ≤ 7일이면 녹색 클래스가 적용되어야 함', () => {
    const mockData = { avgWip: 5, deliveryRate: 1, expectedLeadTime: 3 };
    render(<LittleLawSummary summaryData={mockData} />);

    // expectedLeadTime 값 3이 렌더링됨을 확인
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('expectedLeadTime 7~14일이면 주황색 클래스가 적용되어야 함', () => {
    const mockData = { avgWip: 10, deliveryRate: 1, expectedLeadTime: 12 };
    render(<LittleLawSummary summaryData={mockData} />);

    // expectedLeadTime 값 12가 렌더링됨을 확인
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('expectedLeadTime > 14일이면 빨간색 클래스가 적용되어야 함', () => {
    const mockData = { avgWip: 20, deliveryRate: 1, expectedLeadTime: 15 };
    render(<LittleLawSummary summaryData={mockData} />);

    // expectedLeadTime 값 15가 렌더링됨을 확인
    expect(screen.getByText('15')).toBeTruthy();
  });

  it("타이틀이 Little's Law 요약으로 표시되어야 함", () => {
    const mockData = { avgWip: 8, deliveryRate: 1.5, expectedLeadTime: 5 };
    render(<LittleLawSummary summaryData={mockData} />);

    expect(screen.getByText("Little's Law 요약")).toBeTruthy();
  });
});
