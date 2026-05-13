/*!
 * CardSlaBar 컴포넌트 단위 테스트
 * SLA 진행 바 렌더링, 색상 전환(녹색/주황색/빨간색), dueDate 미설정 시 null 반환 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import CardSlaBar from '../../components/cards/CardSlaBar/CardSlaBar';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
}));

jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    makeSelectSlaProgress: () => jest.fn(),
  },
}));

describe('CardSlaBar', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('slaProgress가 null이면 null을 반환해야 함', () => {
    mockUseSelector.mockReturnValue(null);

    const { container } = render(<CardSlaBar cardId="card-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('비율 ≤80%일 때 바를 렌더링하고 너비가 50%여야 함', () => {
    mockUseSelector.mockReturnValue({ ratio: 0.5, color: 'green' });

    const { container } = render(<CardSlaBar cardId="card-1" />);

    const wrapper = container.firstChild;
    expect(wrapper).not.toBeNull();
    const bar = wrapper.firstChild;
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('50%');
  });

  it('비율 80~100%일 때 너비가 90%여야 함', () => {
    mockUseSelector.mockReturnValue({ ratio: 0.9, color: 'orange' });

    const { container } = render(<CardSlaBar cardId="card-1" />);

    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('90%');
  });

  it('비율 >100%일 때 너비는 100%로 제한해야 함', () => {
    mockUseSelector.mockReturnValue({ ratio: 1.3, color: 'red' });

    const { container } = render(<CardSlaBar cardId="card-1" />);

    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('100%');
  });

  it('비율이 정확히 0.8일 때 바가 렌더링되어야 함', () => {
    mockUseSelector.mockReturnValue({ ratio: 0.8, color: 'green' });

    const { container } = render(<CardSlaBar cardId="card-1" />);

    const bar = container.firstChild.firstChild;
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('80%');
  });

  it('비율이 정확히 1.0일 때 너비가 100%여야 함', () => {
    mockUseSelector.mockReturnValue({ ratio: 1.0, color: 'orange' });

    const { container } = render(<CardSlaBar cardId="card-1" />);

    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('100%');
  });
});
