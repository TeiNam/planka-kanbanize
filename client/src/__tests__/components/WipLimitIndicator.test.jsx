/*!
 * WipLimitIndicator 컴포넌트 단위 테스트
 * "현재수/제한값" 형식 렌더링, 초과 시 빨간색 스타일, WIP 미설정 시 null 반환 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import WipLimitIndicator from '../../components/lists/WipLimitIndicator/WipLimitIndicator';

// Redux useSelector 모킹
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
}));

// selectors 모킹 (컴포넌트가 import하는 경로 기준)
jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    makeSelectListById: () => jest.fn(),
    makeSelectWipCount: () => jest.fn(),
  },
}));

// 테스트 헬퍼: useSelector 응답을 설정
function setupSelectorMock({ list, wipCount = 0 }) {
  let callIndex = 0;
  mockUseSelector.mockImplementation(() => {
    const index = callIndex;
    callIndex += 1;

    // WipLimitIndicator 내부 useSelector 호출 순서:
    // 0: list 조회
    // 1: wipCount
    switch (index) {
      case 0:
        return list;
      case 1:
        return wipCount;
      default:
        return null;
    }
  });
}

describe('WipLimitIndicator', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('"현재수/제한값" 형식으로 렌더링해야 함', () => {
    setupSelectorMock({
      list: { id: 'list-1', wipLimit: 5 },
      wipCount: 3,
    });

    const { container } = render(<WipLimitIndicator listId="list-1" />);

    expect(container.textContent).toBe('3/5');
  });

  it('WIP 초과 시 title에 exceeded 메시지가 표시되어야 함', () => {
    setupSelectorMock({
      list: { id: 'list-1', wipLimit: 3 },
      wipCount: 5,
    });

    const { container } = render(<WipLimitIndicator listId="list-1" />);

    const span = container.firstChild;
    expect(span.getAttribute('title')).toBe('WIP limit exceeded');
    expect(container.textContent).toBe('5/3');
  });

  it('WIP 미초과 시 title에 정상 WIP 정보가 표시되어야 함', () => {
    setupSelectorMock({
      list: { id: 'list-1', wipLimit: 10 },
      wipCount: 3,
    });

    const { container } = render(<WipLimitIndicator listId="list-1" />);

    const span = container.firstChild;
    expect(span.getAttribute('title')).toBe('WIP: 3/10');
  });

  it('WIP 제한이 null인 경우 null을 반환해야 함', () => {
    setupSelectorMock({
      list: { id: 'list-1', wipLimit: null },
      wipCount: 5,
    });

    const { container } = render(<WipLimitIndicator listId="list-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('WIP 제한이 undefined인 경우 null을 반환해야 함', () => {
    setupSelectorMock({
      list: { id: 'list-1', wipLimit: undefined },
      wipCount: 2,
    });

    const { container } = render(<WipLimitIndicator listId="list-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('list가 null인 경우 null을 반환해야 함', () => {
    setupSelectorMock({
      list: null,
      wipCount: 0,
    });

    const { container } = render(<WipLimitIndicator listId="non-existent" />);

    expect(container.innerHTML).toBe('');
  });

  it('WIP 카운트가 제한값과 정확히 같을 때 exceeded가 아니어야 함', () => {
    setupSelectorMock({
      list: { id: 'list-1', wipLimit: 5 },
      wipCount: 5,
    });

    const { container } = render(<WipLimitIndicator listId="list-1" />);

    const span = container.firstChild;
    expect(span.getAttribute('title')).toBe('WIP: 5/5');
    expect(container.textContent).toBe('5/5');
  });
});
