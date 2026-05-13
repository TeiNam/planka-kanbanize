/*!
 * ClassOfServicePicker 컴포넌트 단위 테스트
 * CoS 선택 UI, Fixed_Date 비활성화(Due 날짜 미설정 시), 현재 선택 표시 검증
 * Requirements: 5.1~5.8
 */

/* eslint-disable react/prop-types, react/button-has-type */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import ClassOfServicePicker from '../../components/classes-of-service/ClassOfServicePicker';

// Redux 모킹
const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
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
    makeSelectClassesOfServiceByBoardId: () => jest.fn(),
    makeSelectCardById: () => jest.fn(),
  },
}));

// custom-ui 모킹
jest.mock('../../lib/custom-ui', () => ({
  Popup: {
    Header: ({ children, onBack }) => (
      <div data-testid="popup-header">
        {onBack && (
          <button data-testid="back-button" onClick={onBack}>
            Back
          </button>
        )}
        {children}
      </div>
    ),
    Content: ({ children }) => <div data-testid="popup-content">{children}</div>,
  },
}));

// 테스트 데이터
const mockClassesOfService = [
  { id: 'cos-1', name: 'Expedite', type: 'expedite', color: '#ff0000' },
  { id: 'cos-2', name: 'Fixed Date', type: 'fixed_date', color: '#ff8c00' },
  { id: 'cos-3', name: 'Standard', type: 'standard', color: '#0066cc' },
  { id: 'cos-4', name: 'Intangible', type: 'intangible', color: '#808080' },
];

// 테스트 헬퍼: useSelector 응답을 설정
function setupSelectorMock({ classesOfService, card }) {
  let callIndex = 0;
  mockUseSelector.mockImplementation(() => {
    const index = callIndex;
    callIndex += 1;

    // ClassOfServicePicker 내부 useSelector 호출 순서:
    // 0: selectPath → boardId
    // 1: classesOfService
    // 2: card
    switch (index) {
      case 0:
        return { boardId: 'board-1' };
      case 1:
        return classesOfService;
      case 2:
        return card;
      default:
        return null;
    }
  });
}

describe('ClassOfServicePicker', () => {
  const mockOnSelect = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    mockUseSelector.mockReset();
    mockOnSelect.mockReset();
    mockOnBack.mockReset();
  });

  it('CoS 목록을 렌더링해야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId={null}
        onSelect={mockOnSelect}
      />,
    );

    expect(container.textContent).toContain('Expedite');
    expect(container.textContent).toContain('Fixed Date');
    expect(container.textContent).toContain('Standard');
    expect(container.textContent).toContain('Intangible');
  });

  it('"None" 옵션을 렌더링해야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId={null}
        onSelect={mockOnSelect}
      />,
    );

    expect(container.textContent).toContain('None');
  });

  it('현재 선택된 CoS에 체크 아이콘을 표시해야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId="cos-1"
        onSelect={mockOnSelect}
      />,
    );

    // 체크 아이콘이 존재
    const checkIcons = container.querySelectorAll('i.check');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('Due 날짜 미설정 시 Fixed_Date 옵션이 비활성화되어야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: null },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId={null}
        onSelect={mockOnSelect}
      />,
    );

    // "Due date required" 경고 텍스트가 표시됨
    expect(container.textContent).toContain('Due date required');

    // disabled 버튼이 존재
    const disabledButtons = container.querySelectorAll('button[disabled]');
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('Due 날짜가 설정된 경우 Fixed_Date 옵션이 활성화되어야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId={null}
        onSelect={mockOnSelect}
      />,
    );

    // "Due date required" 경고가 없어야 함
    expect(container.textContent).not.toContain('Due date required');
  });

  it('CoS 항목 클릭 시 onSelect를 호출해야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId={null}
        onSelect={mockOnSelect}
      />,
    );

    // 첫 번째 CoS 항목(Expedite) 클릭
    const buttons = container.querySelectorAll('button');
    // buttons[0]은 None, buttons[1]은 Expedite
    fireEvent.click(buttons[1]);

    expect(mockOnSelect).toHaveBeenCalledWith('cos-1');
  });

  it('None 클릭 시 onSelect(null)을 호출해야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId="cos-1"
        onSelect={mockOnSelect}
      />,
    );

    // None 버튼 클릭
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[0]);

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('이미 선택된 CoS를 다시 클릭하면 onSelect를 호출하지 않아야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId="cos-1"
        onSelect={mockOnSelect}
      />,
    );

    // Expedite(이미 선택됨) 클릭
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[1]);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('classesOfService가 null이면 null을 반환해야 함', () => {
    setupSelectorMock({
      classesOfService: null,
      card: { id: 'card-1', dueDate: null },
    });

    const { container } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId={null}
        onSelect={mockOnSelect}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('헤더에 "Class of Service" 제목을 표시해야 함', () => {
    setupSelectorMock({
      classesOfService: mockClassesOfService,
      card: { id: 'card-1', dueDate: '2025-12-31T00:00:00.000Z' },
    });

    const { getByTestId } = render(
      <ClassOfServicePicker
        cardId="card-1"
        currentClassOfServiceId={null}
        onSelect={mockOnSelect}
      />,
    );

    expect(getByTestId('popup-header').textContent).toContain('Class of Service');
  });
});
