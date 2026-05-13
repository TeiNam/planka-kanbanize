/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Header, Icon, Loader, Message, Segment } from 'semantic-ui-react';

import api from '../../api';
import selectors from '../../selectors';
import MetricsFilter from './MetricsFilter';

import styles from './MetricsDashboard.module.scss';

// 차트 컴포넌트 lazy loading
const CfdChart = lazy(() => import('./CfdChart/CfdChart'));
const LeadTimeHistogram = lazy(() => import('./LeadTimeHistogram/LeadTimeHistogram'));
const RunChart = lazy(() => import('./RunChart/RunChart'));
const WipAgingChart = lazy(() => import('./WipAgingChart/WipAgingChart'));

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
  const accessToken = useSelector(selectors.selectAccessToken);

  const [isLoading, setIsLoading] = useState(false);
  const [cfdData, setCfdData] = useState(null);
  const [leadTimeData, setLeadTimeData] = useState(null);
  const [throughputData, setThroughputData] = useState(null);
  const [wipAgingData, setWipAgingData] = useState(null);
  const [wipAgingLists, setWipAgingLists] = useState(null);

  // 메트릭 데이터 fetch (API 직접 호출 — 응답을 local state에 저장)
  const fetchMetrics = useCallback(
    async (filter) => {
      setIsLoading(true);

      const data = {
        startDate: filter.startDate,
        endDate: filter.endDate,
        ...(filter.classOfServiceIds &&
          filter.classOfServiceIds.length > 0 && {
            classOfServiceId: filter.classOfServiceIds[0],
          }),
      };

      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

      try {
        const [cfdRes, leadTimeRes, throughputRes, wipAgingRes] = await Promise.all([
          api.fetchCfd(boardId, data, headers).catch(() => ({ item: null })),
          api.fetchLeadTime(boardId, data, headers).catch(() => ({ item: null })),
          api.fetchThroughput(boardId, data, headers).catch(() => ({ item: null })),
          api.fetchWipAging(boardId, data, headers).catch(() => ({ item: null })),
        ]);

        setCfdData((cfdRes && cfdRes.item) || null);
        setLeadTimeData((leadTimeRes && leadTimeRes.item) || null);

        // Throughput: 서버 {weeks:[{week,count}], average} → 차트 {weeks:[string], counts:[number]}
        const tp = throughputRes && throughputRes.item;
        if (tp && Array.isArray(tp.weeks)) {
          setThroughputData({
            weeks: tp.weeks.map((w) => w.week),
            counts: tp.weeks.map((w) => w.count),
          });
        } else {
          setThroughputData(null);
        }

        // Wip Aging: 서버 {lists:[{listId,name,cards:[{cardId,name,age}]}]} → 차트 flat 배열 + lists
        const wa = wipAgingRes && wipAgingRes.item;
        if (wa && Array.isArray(wa.lists)) {
          const flat = [];
          wa.lists.forEach((list) => {
            (list.cards || []).forEach((card) => {
              flat.push({
                cardId: card.cardId,
                cardName: card.name,
                listId: list.listId,
                ageDays: card.age,
              });
            });
          });
          setWipAgingData(flat);
          setWipAgingLists(wa.lists.map((l) => ({ id: l.listId, name: l.name })));
        } else {
          setWipAgingData(null);
          setWipAgingLists(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [boardId, accessToken],
  );

  // 마운트 시 기본 필터로 데이터 fetch
  useEffect(() => {
    fetchMetrics(getDefaultFilter());
  }, [fetchMetrics]);

  const hasAnyData =
    !!cfdData ||
    !!(leadTimeData && leadTimeData.values && leadTimeData.values.length > 0) ||
    !!(throughputData && throughputData.weeks && throughputData.weeks.length > 0) ||
    !!(wipAgingData && wipAgingData.length > 0);

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

      {!isLoading && !hasAnyData && renderNoDataMessage()}

      {!isLoading && hasAnyData && (
        <div className={styles.chartsGrid}>
          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.cumulativeFlowDiagram', { defaultValue: 'Cumulative Flow Diagram' })}
                </Header>
                <CfdChart data={cfdData} />
              </Segment>
            </div>
          </Suspense>

          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.leadTimeDistribution', { defaultValue: 'Lead Time Distribution' })}
                </Header>
                <LeadTimeHistogram data={leadTimeData} />
              </Segment>
            </div>
          </Suspense>

          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.runChart', { defaultValue: 'Run Chart & Throughput' })}
                </Header>
                <RunChart leadTimeData={leadTimeData} throughputData={throughputData} />
              </Segment>
            </div>
          </Suspense>

          <Suspense fallback={<ChartFallback />}>
            <div className={styles.chartCard}>
              <Segment>
                <Header as="h4">
                  {t('common.wipAgingChart', { defaultValue: 'WIP Aging Chart' })}
                </Header>
                <WipAgingChart wipAgingData={wipAgingData} lists={wipAgingLists} />
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
