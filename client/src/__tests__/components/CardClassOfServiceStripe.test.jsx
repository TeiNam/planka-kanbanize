/*!
 * CardClassOfServiceStripe 컴포넌트 단위 테스트
 * 카드 좌측 4px 색상 띠 렌더링, CoS 미할당 시 null 반환 검증
 * Requirements: 5.1~5.8
 */

import React from 'react';
import { render } from '@testing-library/react';

import CardClassOfServiceStripe from '../../components/classes-of-service/CardClassOfServiceStripe';

// Redux useSelector 모킹
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
}));

// selectors 모킹
jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    makeSelectClassOfServiceById: () => jest.fn(),
  },
}));

// 테스트 헬퍼: useSelector 응답을 설정
function setupSelectorMock({ classOfService }) {
  mockUseSelector.mockImplementation(() => classOfService);
}

describe('CardClassOfServiceStripe', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('올바른 색상으로 4px 색상 띠를 렌더링해야 함', () => {
    setupSelectorMock({
      classOfService: {
        id: 'cos-1',
        name: 'Expedite',
        color: '#ff0000',
      },
    });

    const { container } = render(<CardClassOfServiceStripe classOfServiceId="cos-1" />);

    const stripe = container.firstChild;
    expect(stripe).not.toBeNull();
    expect(stripe.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(stripe.getAttribute('title')).toBe('Expedite');
  });

  it('classOfServiceId가 null이면 null을 반환해야 함', () => {
    setupSelectorMock({
      classOfService: null,
    });

    const { container } = render(<CardClassOfServiceStripe classOfServiceId={null} />);

    expect(container.innerHTML).toBe('');
  });

  it('classOfService를 찾을 수 없으면 null을 반환해야 함', () => {
    setupSelectorMock({
      classOfService: null,
    });

    const { container } = render(<CardClassOfServiceStripe classOfServiceId="non-existent" />);

    expect(container.innerHTML).toBe('');
  });
});
