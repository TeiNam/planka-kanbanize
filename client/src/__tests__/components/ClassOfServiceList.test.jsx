/*!
 * ClassOfServiceList 컴포넌트 단위 테스트
 * CoS 목록 렌더링, 기본 4종 표시, 사용자 정의 추가/편집/삭제, 최대 10개 제한 검증
 * Requirements: 5.1~5.8
 */

import React from 'react';
import { render } from '@testing-library/react';

import ClassOfServiceList from '../../components/classes-of-service/ClassOfServiceList';

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
    makeSelectClassesOfServiceByBoardId: () => jest.fn(),
  },
}));

// entry-actions 모킹
jest.mock('../../entry-actions', () => ({
  __esModule: true,
  default: {
    createClassOfServiceInCurrentBoard: jest.fn((data) => ({
      type: 'CLASS_OF_SERVICE_IN_CURRENT_BOARD_CREATE',
      payload: data,
    })),
    updateClassOfService: jest.fn((id, data) => ({
      type: 'CLASS_OF_SERVICE_UPDATE',
      payload: { id, data },
    })),
    deleteClassOfService: jest.fn((id) => ({
      type: 'CLASS_OF_SERVICE_DELETE',
      payload: { id },
    })),
  },
}));

// hooks 모킹
let mockFormData = { name: '', color: '#109dc0', policy: '' };
const mockHandleFieldChange = jest.fn((e, { name, value } = {}) => {
  if (name) {
    mockFormData = { ...mockFormData, [name]: value };
  }
});
const mockSetFormData = jest.fn((data) => {
  mockFormData = { ...data };
});

jest.mock('../../hooks', () => ({
  useForm: () => [mockFormData, mockHandleFieldChange, mockSetFormData],
}));

// 기본 4종 CoS 데이터
const defaultClassesOfService = [
  {
    id: 'cos-1',
    name: 'Expedite',
    type: 'expedite',
    color: '#ff0000',
    isDefault: true,
    policy: null,
    position: 1,
  },
  {
    id: 'cos-2',
    name: 'Fixed Date',
    type: 'fixed_date',
    color: '#ff8c00',
    isDefault: true,
    policy: null,
    position: 2,
  },
  {
    id: 'cos-3',
    name: 'Standard',
    type: 'standard',
    color: '#0066cc',
    isDefault: true,
    policy: null,
    position: 3,
  },
  {
    id: 'cos-4',
    name: 'Intangible',
    type: 'intangible',
    color: '#808080',
    isDefault: true,
    policy: null,
    position: 4,
  },
];

describe('ClassOfServiceList', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
    mockDispatch.mockReset();
    mockFormData = { name: '', color: '#109dc0', policy: '' };
  });

  it('기본 4종 CoS를 모두 렌더링해야 함', () => {
    mockUseSelector.mockImplementation(() => defaultClassesOfService);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    expect(container.textContent).toContain('Expedite');
    expect(container.textContent).toContain('Fixed Date');
    expect(container.textContent).toContain('Standard');
    expect(container.textContent).toContain('Intangible');
  });

  it('각 CoS 항목에 색상 스와치를 표시해야 함', () => {
    mockUseSelector.mockImplementation(() => defaultClassesOfService);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    // 색상 스와치 div가 존재하고 배경색이 설정됨
    const swatches = container.querySelectorAll('[style]');
    const hasRedSwatch = Array.from(swatches).some(
      (el) => el.style.backgroundColor === 'rgb(255, 0, 0)',
    );
    expect(hasRedSwatch).toBe(true);
  });

  it('기본 CoS에는 잠금 아이콘을 표시해야 함', () => {
    mockUseSelector.mockImplementation(() => defaultClassesOfService);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    // lock 아이콘이 기본 CoS에 표시됨
    const lockIcons = container.querySelectorAll('i.lock');
    expect(lockIcons.length).toBe(4);
  });

  it('사용자 정의 CoS에는 삭제 버튼을 표시해야 함', () => {
    const classesWithCustom = [
      ...defaultClassesOfService,
      {
        id: 'cos-5',
        name: 'Custom One',
        type: 'custom',
        color: '#00ff00',
        isDefault: false,
        policy: null,
        position: 5,
      },
    ];
    mockUseSelector.mockImplementation(() => classesWithCustom);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    // 삭제 버튼(trash 아이콘)이 사용자 정의 CoS에 표시됨
    const trashButtons = container.querySelectorAll('i.trash');
    expect(trashButtons.length).toBeGreaterThan(0);
  });

  it('"Add Custom" 버튼을 렌더링해야 함', () => {
    mockUseSelector.mockImplementation(() => defaultClassesOfService);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    expect(container.textContent).toContain('Add Custom');
  });

  it('사용자 정의 CoS가 10개에 도달하면 추가 버튼이 비활성화되어야 함', () => {
    const maxCustom = Array.from({ length: 10 }, (_, i) => ({
      id: `custom-${i}`,
      name: `Custom ${i}`,
      type: 'custom',
      color: '#00ff00',
      isDefault: false,
      policy: null,
      position: 5 + i,
    }));
    const classesWithMax = [...defaultClassesOfService, ...maxCustom];
    mockUseSelector.mockImplementation(() => classesWithMax);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    // "max reached" 텍스트가 표시됨
    expect(container.textContent).toContain('max reached');
  });

  it('classesOfService가 null이면 null을 반환해야 함', () => {
    mockUseSelector.mockImplementation(() => null);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('CoS 타입 배지를 표시해야 함', () => {
    mockUseSelector.mockImplementation(() => defaultClassesOfService);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    // 타입 배지 텍스트가 표시됨
    expect(container.textContent).toContain('expedite');
    expect(container.textContent).toContain('fixed_date');
    expect(container.textContent).toContain('standard');
    expect(container.textContent).toContain('intangible');
  });

  it('정책 텍스트가 50자를 초과하면 말줄임표로 표시해야 함', () => {
    const longPolicy = 'A'.repeat(60);
    const classesWithPolicy = [
      {
        id: 'cos-1',
        name: 'Expedite',
        type: 'expedite',
        color: '#ff0000',
        isDefault: true,
        policy: longPolicy,
        position: 1,
      },
    ];
    mockUseSelector.mockImplementation(() => classesWithPolicy);

    const { container } = render(<ClassOfServiceList boardId="board-1" />);

    // 50자 + "..." 형태로 잘림
    expect(container.textContent).toContain('...');
    expect(container.textContent).not.toContain(longPolicy);
  });
});
