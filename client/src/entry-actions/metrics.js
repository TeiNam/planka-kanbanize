/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const fetchCfd = (boardId, data) => ({
  type: EntryActionTypes.METRICS_CFD_FETCH,
  payload: {
    boardId,
    data,
  },
});

const fetchLeadTime = (boardId, data) => ({
  type: EntryActionTypes.METRICS_LEAD_TIME_FETCH,
  payload: {
    boardId,
    data,
  },
});

const fetchThroughput = (boardId, data) => ({
  type: EntryActionTypes.METRICS_THROUGHPUT_FETCH,
  payload: {
    boardId,
    data,
  },
});

const fetchWipAging = (boardId, data) => ({
  type: EntryActionTypes.METRICS_WIP_AGING_FETCH,
  payload: {
    boardId,
    data,
  },
});

const fetchSummary = (boardId, data) => ({
  type: EntryActionTypes.METRICS_SUMMARY_FETCH,
  payload: {
    boardId,
    data,
  },
});

export default {
  fetchCfd,
  fetchLeadTime,
  fetchThroughput,
  fetchWipAging,
  fetchSummary,
};
