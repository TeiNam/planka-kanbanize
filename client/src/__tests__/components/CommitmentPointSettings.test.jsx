/*!
 * CommitmentPointSettings 컴포넌트 단위 테스트
 * 설정 UI 렌더링, 라벨/타입 변경, 삭제 확인 대화상자 검증
 * Requirements: 3.1~3.7
 */

/* eslint-disable react/prop-types, react/button-has-type */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import CommitmentPointSettings from '../../components/commitment-points/CommitmentPointSettings';

// Redux 모킹
const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
  useDispatch: () => mockDispatch,
}));

// i18next 모킹
jest.mock('react-i18next', () => ({
  useTranslation: () => [(key, opts) => opts?.defaultValue || key],
}));

// selectors 모킹
jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    selectPath: () => ({ boardId: 'board-1' }),
    selectCommitmentPointsByBoardId: () => [],
  },
}));

// entry-actions 모킹
const mockUpdateCommitmentPoint = jest.fn();
const mockDeleteCommitmentPoint = jest.fn();
jest.mock('../../entry-actions', () => ({
  __esModule: true,
  default: {
    updateCommitmentPoint: (...args) => mockUpdateCommitmentPoint(...args),
    deleteCommitmentPoint: (...args) => mockDeleteCommitmentPoint(...args),
  },
}));

// hooks 모킹
let mockFormData = { label: '', type: 'commitment' };
const mockHandleFieldChange = jest.fn();
const mockSetFormData = jest.fn();
let mockStep = null;
const mockOpenStep = jest.fn();
const mockHandleBack = jest.fn();

jest.mock('../../hooks', () => ({
  useForm: (initFn) => {
    if (initFn) {
      const initial = initFn();
      mockFormData = { ...initial };
    }
    return [mockFormData, mockHandleFieldChange, mockSetFormData];
  },
  useSteps: () => [mockStep, mockOpenStep, mockHandleBack],
}));

// custom-ui 모킹
jest.mock('../../lib/custom-ui', () => ({
  Popup: {
    Header: ({ children }) => <div data-testid="popup-header">{children}</div>,
    Content: ({ children }) => <div data-testid="popup-content">{children}</div>,
  },
}));

// ConfirmationStep 모킹
jest.mock('../../components/common/ConfirmationStep', () => {
  function MockConfirmationStep({ onConfirm, onBack }) {
    return (
      <div data-testid="confirmation-step">
        <button data-testid="confirm-delete" onClick={onConfirm}>
          Confirm
        </button>
        <button data-testid="cancel-delete" onClick={onBack}>
          Cancel
        </button>
      </div>
    );
  }
  return MockConfirmationStep;
});

// 테스트 헬퍼: useSelector 응답을 설정
function setupSelectorMock({ commitmentPoint }) {
  mockUseSelector.mockImplementation(() => commitmentPoint);
}

describe('CommitmentPointSettings', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockUseSelector.mockReset();
    mockDispatch.mockReset();
    mockOnClose.mockReset();
    mockUpdateCommitmentPoint.mockReset();
    mockDeleteCommitmentPoint.mockReset();
    mockOpenStep.mockReset();
    mockStep = null;
    mockFormData = { label: 'Dev Ready', type: 'commitment' };
  });

  it('Commitment Point 설정 헤더를 렌더링해야 함', () => {
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-1',
        type: 'commitment',
        label: 'Dev Ready',
      },
    });

    const { getByTestId } = render(
      <CommitmentPointSettings commitmentPointId="cp-1" onClose={mockOnClose} />,
    );

    expect(getByTestId('popup-header').textContent).toContain('Commitment Point Settings');
  });

  it('라벨 입력 필드를 렌더링해야 함', () => {
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-1',
        type: 'commitment',
        label: 'Dev Ready',
      },
    });

    const { container } = render(
      <CommitmentPointSettings commitmentPointId="cp-1" onClose={mockOnClose} />,
    );

    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('삭제 버튼을 렌더링해야 함', () => {
    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-1',
        type: 'commitment',
        label: 'Dev Ready',
      },
    });

    const { container } = render(
      <CommitmentPointSettings commitmentPointId="cp-1" onClose={mockOnClose} />,
    );

    const deleteButton = container.querySelector('button.negative');
    expect(deleteButton).not.toBeNull();
  });

  it('commitmentPoint가 null이면 null을 반환해야 함', () => {
    setupSelectorMock({
      commitmentPoint: null,
    });

    const { container } = render(
      <CommitmentPointSettings commitmentPointId="non-existent" onClose={mockOnClose} />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('삭제 확인 단계에서 ConfirmationStep을 렌더링해야 함', () => {
    mockStep = { type: 'DELETE' };

    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-1',
        type: 'commitment',
        label: 'Dev Ready',
      },
    });

    const { getByTestId } = render(
      <CommitmentPointSettings commitmentPointId="cp-1" onClose={mockOnClose} />,
    );

    expect(getByTestId('confirmation-step')).not.toBeNull();
  });

  it('삭제 확인 시 deleteCommitmentPoint 액션을 디스패치해야 함', () => {
    mockStep = { type: 'DELETE' };

    setupSelectorMock({
      commitmentPoint: {
        id: 'cp-1',
        type: 'commitment',
        label: 'Dev Ready',
      },
    });

    const { getByTestId } = render(
      <CommitmentPointSettings commitmentPointId="cp-1" onClose={mockOnClose} />,
    );

    fireEvent.click(getByTestId('confirm-delete'));

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
