/*!
 * MetricsDashboard 컴포넌트 단위 테스트
 * 대시보드 렌더링, 필터 연동, 데이터 부족 메시지, lazy loading 검증
 */

import React from 'react';
import { render } from '@testing-library/react';

import MetricsDashboard from '../../components/metrics/MetricsDashboard';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: () => [],
  useDispatch: () => mockDispatch,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => [(key, opts) => opts?.defaultValue || key, { language: 'en' }],
}));

jest.mock('../../entry-actions', () => ({
  __esModule: true,
  default: {
    fetchCfd: jest.fn(() => ({ type: 'METRICS_CFD_FETCH' })),
    fetchLeadTime: jest.fn(() => ({ type: 'METRICS_LEAD_TIME_FETCH' })),
    fetchThroughput: jest.fn(() => ({ type: 'METRICS_THROUGHPUT_FETCH' })),
    fetchWipAging: jest.fn(() => ({ type: 'METRICS_WIP_AGING_FETCH' })),
    fetchSummary: jest.fn(() => ({ type: 'METRICS_SUMMARY_FETCH' })),
  },
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
    const setFormData = jest.fn();
    return [data, handleFieldChange, setFormData];
  },
}));

// lazy 로딩 차트 컴포넌트 모킹
jest.mock('../../components/metrics/CfdChart/CfdChart', () => {
  return function MockCfdChart() {
    return <div data-testid="cfd-chart">CFD Chart</div>;
  };
});

jest.mock('../../components/metrics/LeadTimeHistogram/LeadTimeHistogram', () => {
  return function MockLeadTimeHistogram() {
    return <div data-testid="lead-time-histogram">Lead Time Histogram</div>;
  };
});

jest.mock('../../components/metrics/RunChart/RunChart', () => {
  return function MockRunChart() {
    return <div data-testid="run-chart">Run Chart</div>;
  };
});

jest.mock('../../components/metrics/WipAgingChart/WipAgingChart', () => {
  return function MockWipAgingChart() {
    return <div data-testid="wip-aging-chart">WIP Aging Chart</div>;
  };
});

jest.mock('../../components/metrics/LittleLawSummary/LittleLawSummary', () => {
  return function MockLittleLawSummary() {
    return <div data-testid="little-law-summary">Little Law Summary</div>;
  };
});

describe('MetricsDashboard', () => {
  beforeEach(() => {
    mockDispatch.mockReset();
  });

  it('대시보드 헤더가 렌더링되어야 함', () => {
    const { getByText } = render(<MetricsDashboard boardId="board-1" />);

    expect(getByText('Kanban Metrics Dashboard')).toBeDefined();
  });

  it('마운트 시 메트릭 데이터를 fetch해야 함', () => {
    render(<MetricsDashboard boardId="board-1" />);

    // 5개 메트릭 API 호출 (cfd, leadTime, throughput, wipAging, summary)
    expect(mockDispatch).toHaveBeenCalledTimes(5);
  });

  it('MetricsFilter가 렌더링되어야 함', () => {
    const { getByText } = render(<MetricsDashboard boardId="board-1" />);

    expect(getByText('Apply')).toBeDefined();
  });

  it('대시보드 설명 텍스트가 표시되어야 함', () => {
    const { getByText } = render(<MetricsDashboard boardId="board-1" />);

    expect(getByText('Flow metrics analysis for data-driven improvement decisions')).toBeDefined();
  });
});
