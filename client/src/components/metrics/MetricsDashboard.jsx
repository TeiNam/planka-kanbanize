/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Header, Icon, Loader, Message, Segment } from 'semantic-ui-react';

import entryActions from '../../entry-actions';
import MetricsFilter from './MetricsFilter';

import styles from './MetricsDashboard.module.scss';

// 차트 컴포넌트 lazy loading
const CfdChart = lazy(() => import('./CfdChart/CfdChart'));
const LeadTimeHistogram = lazy(() => import('./LeadTimeHistogram/LeadTimeHistogram'));
const RunChart = lazy(() => import('./RunChart/RunChart'));
const WipAgingChart = lazy(() => import('./WipAgingChart/WipAgingChart'));
const LittleLawSummary = lazy(() => import('./LittleLawSummary/LittleLawSummary'));

// 차트 로딩 폴백 컴포넌트
function ChartFallback() {
  return (
    <div className={styles.chartFallback}>
      <Loader active inline="centered" size="small" />
    </div>
  );
}

// 기본 필터 값 (최근 30일)
const getDefaultFilter = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

const MetricsDashboard = React.memo(({ boardId }) => {
  const [t] = useTranslation();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(true);

  // 메트릭 데이터 fetch
  const fetchMetrics = useCallback(
    (filter) => {
      setIsLoading(true);

      const data = {
        startDate: filter.startDate,
        endDate: filter.endDate,
        ...(filter.classOfServiceIds &&
          filter.classOfServiceIds.length > 0 && {
            classOfServiceId: filter.classOfServiceIds[0],
          }),
      };

      dispatch(entryActions.fetchCfd(boardId, data));
      dispatch(entryActions.fetchLeadTime(boardId, data));
      dispatch(entryActions.fetchThroughput(boardId, data));
      dispatch(entryActions.fetchWipAging(boardId, data));
      dispatch(entryActions.fetchSummary(boardId, data));

      // 로딩 상태 해제 (비동기 완료 시뮬레이션)
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    },
    [boardId, dispatch],
  );

  // 마운트 시 기본 필터로 데이터 fetch
  useEffect(() => {
    fetchMetrics(getDefaultFilter());
  }, [fetchMetrics]);

  // 필터 적용 핸들러
  const handleFilterApply = useCallback(
    (filter) => {
      fetchMetrics(filter);
    },
    [fetchMetrics],
  );

  // 데이터 부족 안내 메시지
  const renderNoDataMessage = () => (
    <Message icon className={styles.noDataMessage}>
      <Icon name="info circle" />
      <Message.Content>
        <Message.Header>
          {t('common.insufficientData', { defaultValue: 'Insufficient Data' })}
        </Message.Header>
        <p>
          {t('common.insufficientDataDescription', {
            defaultValue:
              'There is not enough data to display metrics for the selected period. Cards need to be completed to generate metrics.',
          })}
        </p>
      </Message.Content>
    </Message>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Header as="h2" className={styles.title}>
          <Icon name="chart bar" />
          <Header.Content>
            {t('common.metricsDashboard', { defaultValue: 'Kanban Metrics Dashboard' })}
            <Header.Subheader>
              {t('common.metricsDashboardDescription', {
                defaultValue: 'Flow metrics analysis for data-driven improvement decisions',
              })}
            </Header.Subheader>
          </Header.Content>
        </Header>
      </div>

      <MetricsFilter boardId={boardId} onApply={handleFilterApply} isLoading={isLoading} />

      {isLoading && (
        <Segment className={styles.loadingSegment}>
          <Loader
            active
            inline="centered"
            content={t('common.loading', { defaultValue: 'Loading metrics...' })}
          />
        </Segment>
      )}

      {!isLoading && !hasData && renderNoDataMessage()}

      {!isLoading && hasData && (
        <div className={styles.chartsGrid}>
          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.cumulativeFlowDiagram', { defaultValue: 'Cumulative Flow Diagram' })}
                </Header>
                <CfdChart boardId={boardId} onNoData={() => setHasData(false)} />
              </Segment>
            </div>
          </Suspense>

          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.leadTimeDistribution', { defaultValue: 'Lead Time Distribution' })}
                </Header>
                <LeadTimeHistogram boardId={boardId} />
              </Segment>
            </div>
          </Suspense>

          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.runChart', { defaultValue: 'Run Chart & Throughput' })}
                </Header>
                <RunChart boardId={boardId} />
              </Segment>
            </div>
          </Suspense>

          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.wipAgingChart', { defaultValue: 'WIP Aging Chart' })}
                </Header>
                <WipAgingChart boardId={boardId} />
              </Segment>
            </div>
          </Suspense>

          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.littleLawSummary', { defaultValue: "Little's Law Summary" })}
                </Header>
                <LittleLawSummary boardId={boardId} />
              </Segment>
            </div>
          </Suspense>
        </div>
      )}
    </div>
  );
});

MetricsDashboard.propTypes = {
  boardId: PropTypes.string.isRequired,
};

export default MetricsDashboard;
