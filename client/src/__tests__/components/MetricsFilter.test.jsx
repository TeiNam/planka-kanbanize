/*!
 * MetricsFilter 컴포넌트 단위 테스트
 * 날짜 범위 필터, CoS 필터, Apply 버튼 동작 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import MetricsFilter from '../../components/metrics/MetricsFilter';

const mockUseSelector = jest.fn();
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (fn) => mockUseSelector(fn),
  useDispatch: () => mockDispatch,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => [(key, opts) => opts?.defaultValue || key, { language: 'en' }],
}));

jest.mock('../../selectors', () => ({
  __esModule: true,
  default: {
    makeSelectClassesOfServiceByBoardId: () => jest.fn(),
  },
}));

jest.mock('../../hooks', () => ({
  useForm: (initializer) => {
    const initial = typeof initializer === 'function' ? initializer() : initializer;
    const data = { ...initial };
    const handleFieldChange = jest.fn();
    const setFormData = jest.fn((updater) => {
      if (typeof updater === 'function') {
        Object.assign(data, updater(data));
      } else {
        Object.assign(data, updater);
      }
    });
    return [data, handleFieldChange, setFormData];
  },
}));

describe('MetricsFilter', () => {
  const mockOnApply = jest.fn();

  beforeEach(() => {
    mockUseSelector.mockReset();
    mockDispatch.mockReset();
    mockOnApply.mockReset();
  });

  it('기본 상태로 렌더링되어야 함', () => {
    mockUseSelector.mockReturnValue([
      { id: 'cos-1', name: 'Expedite', color: '#ff0000' },
      { id: 'cos-2', name: 'Standard', color: '#0000ff' },
    ]);

    const { container } = render(<MetricsFilter boardId="board-1" onApply={mockOnApply} />);

    expect(container.firstChild).not.toBeNull();
  });

  it('Apply 버튼이 렌더링되어야 함', () => {
    mockUseSelector.mockReturnValue([]);

    const { getByText } = render(<MetricsFilter boardId="board-1" onApply={mockOnApply} />);

    expect(getByText('Apply')).toBeDefined();
  });

  it('isLoading이 true일 때 Apply 버튼이 비활성화되어야 함', () => {
    mockUseSelector.mockReturnValue([]);

    const { container } = render(
      <MetricsFilter boardId="board-1" onApply={mockOnApply} isLoading />,
    );

    const button = container.querySelector('button.primary');
    expect(button).not.toBeNull();
    expect(button.classList.contains('disabled')).toBe(true);
  });

  it('현재 필터 상태 정보가 표시되어야 함', () => {
    mockUseSelector.mockReturnValue([]);

    const { getByText } = render(<MetricsFilter boardId="board-1" onApply={mockOnApply} />);

    expect(getByText(/Showing/)).toBeDefined();
    expect(getByText(/30/)).toBeDefined();
  });

  it('CoS가 없을 때도 정상 렌더링되어야 함', () => {
    mockUseSelector.mockReturnValue(null);

    const { container } = render(<MetricsFilter boardId="board-1" onApply={mockOnApply} />);

    expect(container.firstChild).not.toBeNull();
  });
});
