/*!
 * CommitmentPointLine 컴포넌트 단위 테스트
 * Commitment Point 구분선 렌더링, 타입별 스타일, 라벨 표시, 타입 인디케이터 검증
 * Requirements: 3.1~3.7
 */

import React from 'react';
import { render } from '@testing-library/react';

import CommitmentPointLine from '../../components/commitment-points/CommitmentPointLine';

// Redux useSelector 모킹
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
}));

// selectors 모킹
jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    selectPath: () => ({ boardId: 'board-1' }),
    selectCommitmentPointsByBoardId: () => [],
    selectCurrentUserMembershipForCurrentBoard: () => null,
  },
}));

// popup 라이브러리 모킹
jest.mock('../../lib/popup', () => ({
  usePopup: () => {
    const Popup = ({ children }) => children;
    return Popup;
  },
}));

// CommitmentPointSettings 모킹
jest.mock('../../components/commitment-points/CommitmentPointSettings', () => {
  function MockSettings() {
    return <div data-testid="commitment-point-settings" />;
  }
  return MockSettings;
});

// 테스트 헬퍼: useSelector 응답을 설정
function setupSelectorMock({ commitmentPoint, canEdit = false }) {
  let callIndex = 0;
  mockUseSelector.mockImplementation(() => {
    const index = callIndex;
    callIndex += 1;

    // CommitmentPointLine 내부 useSelector 호출 순서:
    // 0: commitmentPoint 조회
    // 1: canEdit
    switch (index) {
      case 0:
        return commitmentPoint;
      case 1:
        return canEdit;
      default:
        return null;
    }
  });
}

describe('CommitmentPointLine', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('commitment 타입일 때 점선 구분선을 렌더링해야 함', () => {
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-1',
        type: 'commitment',
        label: null,
      },
    });

    const { container } = render(<CommitmentPointLine commitmentPointId="cp-1" />);

    // 컴포넌트가 렌더링됨 (null이 아님)
    expect(container.innerHTML).not.toBe('');
    // 타입 인디케이터 'C'가 표시됨
    expect(container.textContent).toContain('C');
  });

  it('delivery 타입일 때 다른 스타일로 렌더링해야 함', () => {
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-2',
        type: 'delivery',
        label: null,
      },
    });

    const { container } = render(<CommitmentPointLine commitmentPointId="cp-2" />);

    // 컴포넌트가 렌더링됨
    expect(container.innerHTML).not.toBe('');
    // 타입 인디케이터 'D'가 표시됨
    expect(container.textContent).toContain('D');
    // 'C'는 표시되지 않음
    expect(container.textContent).not.toContain('C');
  });

  it('라벨이 설정된 경우 라벨 텍스트를 표시해야 함', () => {
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-3',
        type: 'commitment',
        label: 'Dev Ready',
      },
    });

    const { container } = render(<CommitmentPointLine commitmentPointId="cp-3" />);

    expect(container.textContent).toContain('Dev Ready');
  });

  it('타입 인디케이터에 commitment은 "C", delivery는 "D"를 표시해야 함', () => {
    // commitment 타입
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-4',
        type: 'commitment',
        label: null,
      },
    });

    const { container: containerC } = render(<CommitmentPointLine commitmentPointId="cp-4" />);
    expect(containerC.textContent).toContain('C');

    // delivery 타입
    mockUseSelector.mockReset();
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-5',
        type: 'delivery',
        label: null,
      },
    });

    const { container: containerD } = render(<CommitmentPointLine commitmentPointId="cp-5" />);
    expect(containerD.textContent).toContain('D');
  });

  it('commitmentPoint를 찾을 수 없으면 null을 반환해야 함', () => {
    setupSelectorMock({
      commitmentPoint: null,
    });

    const { container } = render(<CommitmentPointLine commitmentPointId="non-existent" />);

    expect(container.innerHTML).toBe('');
  });
});
