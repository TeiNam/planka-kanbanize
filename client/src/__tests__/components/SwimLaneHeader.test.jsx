/*!
 * SwimLaneHeader 컴포넌트 단위 테스트
 * 렌더링, WIP 표시 로직, Expedite 아이콘 표시 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import SwimLaneHeader from '../../components/swim-lanes/SwimLaneHeader';

// Redux useSelector 모킹
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
}));

// i18next 모킹
jest.mock('react-i18next', () => ({
  useTranslation: () => [jest.fn((key) => key)],
}));

// popup 라이브러리 모킹
jest.mock('../../lib/popup', () => ({
  usePopup: () => {
    const Popup = ({ children }) => children;
    return Popup;
  },
}));

// selectors 모킹
jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    makeSelectSwimLaneWipCount: () => jest.fn(),
    makeSelectSwimLaneWipExceeded: () => jest.fn(),
    selectPath: () => ({ boardId: 'board-1' }),
    selectSwimLanesByBoardId: () => [],
    selectCurrentUserMembershipForCurrentBoard: () => null,
  },
}));

// SwimLaneSettings 모킹
jest.mock('../../components/swim-lanes/SwimLaneSettings', () => {
  function MockSettings() {
    return <div data-testid="swim-lane-settings" />;
  }
  return MockSettings;
});

// 테스트 헬퍼: useSelector 응답을 설정
function setupSelectorMock({ swimLane, wipCount = 0, wipExceeded = false, canEdit = false }) {
  let callIndex = 0;
  mockUseSelector.mockImplementation(() => {
    const index = callIndex;
    callIndex += 1;

    // SwimLaneHeader 내부 useSelector 호출 순서:
    // 0: swimLane 조회
    // 1: wipCount
    // 2: wipExceeded
    // 3: canEdit
    switch (index) {
      case 0:
        return swimLane;
      case 1:
        return wipCount;
      case 2:
        return wipExceeded;
      case 3:
        return canEdit;
      default:
        return null;
    }
  });
}

describe('SwimLaneHeader', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('스윔레인 이름을 렌더링해야 함', () => {
    setupSelectorMock({
      swimLane: {
        id: 'sl-1',
        name: 'Feature Development',
        type: 'standard',
        wipLimit: null,
        category: null,
      },
    });

    const { container } = render(<SwimLaneHeader swimLaneId="sl-1" />);

    expect(container.textContent).toContain('Feature Development');
  });

  it('WIP 제한이 설정된 경우 "현재수/제한값" 형식으로 표시해야 함', () => {
    setupSelectorMock({
      swimLane: {
        id: 'sl-1',
        name: 'Dev Lane',
        type: 'standard',
        wipLimit: 5,
        category: null,
      },
      wipCount: 3,
      wipExceeded: false,
    });

    const { container } = render(<SwimLaneHeader swimLaneId="sl-1" />);

    expect(container.textContent).toContain('3/5');
  });

  it('WIP 초과 시 WIP 카운트/제한 텍스트가 표시되어야 함', () => {
    setupSelectorMock({
      swimLane: {
        id: 'sl-1',
        name: 'Overloaded Lane',
        type: 'standard',
        wipLimit: 3,
        category: null,
      },
      wipCount: 5,
      wipExceeded: true,
    });

    const { container } = render(<SwimLaneHeader swimLaneId="sl-1" />);

    // WIP 초과 상태에서도 카운트/제한 텍스트가 표시됨
    expect(container.textContent).toContain('5/3');
  });

  it('Expedite 타입일 때 lightning 아이콘이 렌더링되어야 함', () => {
    setupSelectorMock({
      swimLane: {
        id: 'sl-1',
        name: 'Expedite Lane',
        type: 'expedite',
        wipLimit: 1,
        category: null,
      },
      wipCount: 0,
      wipExceeded: false,
    });

    const { container } = render(<SwimLaneHeader swimLaneId="sl-1" />);

    // Semantic UI Icon 컴포넌트가 lightning 아이콘을 렌더링
    const icon = container.querySelector('i.lightning');
    expect(icon).not.toBeNull();
  });

  it('WIP 제한이 null인 경우 WIP 인디케이터를 표시하지 않아야 함', () => {
    setupSelectorMock({
      swimLane: {
        id: 'sl-1',
        name: 'No Limit Lane',
        type: 'standard',
        wipLimit: null,
        category: null,
      },
      wipCount: 10,
      wipExceeded: false,
    });

    const { container } = render(<SwimLaneHeader swimLaneId="sl-1" />);

    // WIP 제한이 없으므로 "숫자/숫자" 패턴이 없어야 함
    expect(container.textContent).not.toMatch(/\d+\/\d+/);
  });

  it('swimLane이 null이면 아무것도 렌더링하지 않아야 함', () => {
    setupSelectorMock({
      swimLane: null,
    });

    const { container } = render(<SwimLaneHeader swimLaneId="non-existent" />);

    expect(container.innerHTML).toBe('');
  });
});
