/*!
 * CardBlockerBadge 컴포넌트 단위 테스트
 * 활성 블로커 배지 렌더링, 사유 텍스트 30자 자르기, 블로커 없을 때 null 반환 검증
 */

/* eslint-disable react/prop-types */
import React from 'react';
import { render } from '@testing-library/react';

import CardBlockerBadge from '../../components/cards/CardBlockerBadge/CardBlockerBadge';

// Redux useSelector 모킹
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
}));

// selectors 모킹
jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    makeSelectActiveBlockerCount: () => jest.fn(),
    makeSelectBlockersByCardId: () => jest.fn(),
  },
}));

// semantic-ui-react Icon 모킹
jest.mock('semantic-ui-react', () => ({
  Icon: ({ name, className }) => <i data-testid="icon" data-name={name} className={className} />,
}));

// 테스트 헬퍼: useSelector 응답을 설정
function setupSelectorMock({ activeCount, blockers }) {
  let callIndex = 0;
  mockUseSelector.mockImplementation(() => {
    const index = callIndex;
    callIndex += 1;

    // CardBlockerBadge 내부 useSelector 호출 순서:
    // 0: activeCount
    // 1: blockers
    switch (index) {
      case 0:
        return activeCount;
      case 1:
        return blockers;
      default:
        return null;
    }
  });
}

describe('CardBlockerBadge', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('활성 블로커가 없으면 null을 반환해야 함', () => {
    setupSelectorMock({
      activeCount: 0,
      blockers: [],
    });

    const { container } = render(<CardBlockerBadge cardId="card-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('활성 블로커가 있으면 배지를 렌더링해야 함', () => {
    setupSelectorMock({
      activeCount: 2,
      blockers: [
        { id: 'b1', status: 'active', reason: '외부 API 장애' },
        { id: 'b2', status: 'active', reason: '디자인 미확정' },
      ],
    });

    const { container } = render(<CardBlockerBadge cardId="card-1" />);

    expect(container.innerHTML).not.toBe('');
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('외부 API 장애');
  });

  it('블로커 아이콘(ban)을 표시해야 함', () => {
    setupSelectorMock({
      activeCount: 1,
      blockers: [{ id: 'b1', status: 'active', reason: '테스트 블로커' }],
    });

    const { getByTestId } = render(<CardBlockerBadge cardId="card-1" />);

    const icon = getByTestId('icon');
    expect(icon.getAttribute('data-name')).toBe('ban');
  });

  it('사유 텍스트가 30자를 초과하면 말줄임표로 자르기해야 함', () => {
    const longReason = '이것은 30자를 초과하는 매우 긴 블로커 사유 텍스트입니다 추가 텍스트';
    setupSelectorMock({
      activeCount: 1,
      blockers: [{ id: 'b1', status: 'active', reason: longReason }],
    });

    const { container } = render(<CardBlockerBadge cardId="card-1" />);

    // 30자 + "..." 형태로 잘려야 함
    const expectedTruncated = `${longReason.slice(0, 30)}...`;
    expect(container.textContent).toContain(expectedTruncated);
    expect(container.textContent).not.toContain(longReason);
  });

  it('사유 텍스트가 30자 이하이면 그대로 표시해야 함', () => {
    const shortReason = '짧은 사유';
    setupSelectorMock({
      activeCount: 1,
      blockers: [{ id: 'b1', status: 'active', reason: shortReason }],
    });

    const { container } = render(<CardBlockerBadge cardId="card-1" />);

    expect(container.textContent).toContain(shortReason);
  });

  it('첫 번째 활성 블로커의 사유만 표시해야 함', () => {
    setupSelectorMock({
      activeCount: 2,
      blockers: [
        { id: 'b1', status: 'active', reason: '첫 번째 블로커' },
        { id: 'b2', status: 'active', reason: '두 번째 블로커' },
        { id: 'b3', status: 'resolved', reason: '해결된 블로커' },
      ],
    });

    const { container } = render(<CardBlockerBadge cardId="card-1" />);

    expect(container.textContent).toContain('첫 번째 블로커');
    expect(container.textContent).not.toContain('두 번째 블로커');
  });

  it('해결된 블로커만 있고 활성 블로커가 없으면 null을 반환해야 함', () => {
    setupSelectorMock({
      activeCount: 0,
      blockers: [{ id: 'b1', status: 'resolved', reason: '해결됨' }],
    });

    const { container } = render(<CardBlockerBadge cardId="card-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('blockers가 null인 경우에도 안전하게 처리해야 함', () => {
    setupSelectorMock({
      activeCount: 0,
      blockers: null,
    });

    const { container } = render(<CardBlockerBadge cardId="card-1" />);

    expect(container.innerHTML).toBe('');
  });
});
