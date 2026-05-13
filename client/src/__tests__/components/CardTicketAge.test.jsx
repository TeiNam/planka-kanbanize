/*!
 * CardTicketAge 컴포넌트 단위 테스트
 * 티켓 나이 "N일" 형식 렌더링, 나이 0일 때 null 반환 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import CardTicketAge from '../../components/cards/CardTicketAge/CardTicketAge';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
}));

jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    makeSelectTicketAge: () => jest.fn(),
  },
}));

describe('CardTicketAge', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('나이가 0이면 null을 반환해야 함', () => {
    mockUseSelector.mockReturnValue(0);

    const { container } = render(<CardTicketAge cardId="card-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('나이가 1일 때 "1일"을 렌더링해야 함', () => {
    mockUseSelector.mockReturnValue(1);

    const { container } = render(<CardTicketAge cardId="card-1" />);

    expect(container.textContent).toBe('1일');
  });

  it('나이가 30일 때 "30일"을 렌더링해야 함', () => {
    mockUseSelector.mockReturnValue(30);

    const { container } = render(<CardTicketAge cardId="card-1" />);

    expect(container.textContent).toBe('30일');
  });

  it('나이가 null이면 null을 반환해야 함', () => {
    mockUseSelector.mockReturnValue(null);

    const { container } = render(<CardTicketAge cardId="card-1" />);

    expect(container.innerHTML).toBe('');
  });
});
