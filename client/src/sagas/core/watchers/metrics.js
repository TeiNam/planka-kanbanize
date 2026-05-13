/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* metricsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.METRICS_CFD_FETCH, ({ payload: { boardId, data } }) =>
      services.fetchCfd(boardId, data),
    ),
    takeEvery(EntryActionTypes.METRICS_LEAD_TIME_FETCH, ({ payload: { boardId, data } }) =>
      services.fetchLeadTime(boardId, data),
    ),
    takeEvery(EntryActionTypes.METRICS_THROUGHPUT_FETCH, ({ payload: { boardId, data } }) =>
      services.fetchThroughput(boardId, data),
    ),
    takeEvery(EntryActionTypes.METRICS_WIP_AGING_FETCH, ({ payload: { boardId, data } }) =>
      services.fetchWipAging(boardId, data),
    ),
    takeEvery(EntryActionTypes.METRICS_SUMMARY_FETCH, ({ payload: { boardId, data } }) =>
      services.fetchSummary(boardId, data),
    ),
  ]);
}
