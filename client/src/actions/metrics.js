/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const fetchCfd = (boardId, data) => ({
  type: ActionTypes.METRICS_CFD_FETCH,
  payload: {
    boardId,
    data,
  },
});

fetchCfd.success = (boardId, item) => ({
  type: ActionTypes.METRICS_CFD_FETCH__SUCCESS,
  payload: {
    boardId,
    item,
  },
});

fetchCfd.failure = (boardId, error) => ({
  type: ActionTypes.METRICS_CFD_FETCH__FAILURE,
  payload: {
    boardId,
    error,
  },
});

const fetchLeadTime = (boardId, data) => ({
  type: ActionTypes.METRICS_LEAD_TIME_FETCH,
  payload: {
    boardId,
    data,
  },
});

fetchLeadTime.success = (boardId, item) => ({
  type: ActionTypes.METRICS_LEAD_TIME_FETCH__SUCCESS,
  payload: {
    boardId,
    item,
  },
});

fetchLeadTime.failure = (boardId, error) => ({
  type: ActionTypes.METRICS_LEAD_TIME_FETCH__FAILURE,
  payload: {
    boardId,
    error,
  },
});

const fetchThroughput = (boardId, data) => ({
  type: ActionTypes.METRICS_THROUGHPUT_FETCH,
  payload: {
    boardId,
    data,
  },
});

fetchThroughput.success = (boardId, item) => ({
  type: ActionTypes.METRICS_THROUGHPUT_FETCH__SUCCESS,
  payload: {
    boardId,
    item,
  },
});

fetchThroughput.failure = (boardId, error) => ({
  type: ActionTypes.METRICS_THROUGHPUT_FETCH__FAILURE,
  payload: {
    boardId,
    error,
  },
});

const fetchWipAging = (boardId, data) => ({
  type: ActionTypes.METRICS_WIP_AGING_FETCH,
  payload: {
    boardId,
    data,
  },
});

fetchWipAging.success = (boardId, item) => ({
  type: ActionTypes.METRICS_WIP_AGING_FETCH__SUCCESS,
  payload: {
    boardId,
    item,
  },
});

fetchWipAging.failure = (boardId, error) => ({
  type: ActionTypes.METRICS_WIP_AGING_FETCH__FAILURE,
  payload: {
    boardId,
    error,
  },
});

const fetchSummary = (boardId, data) => ({
  type: ActionTypes.METRICS_SUMMARY_FETCH,
  payload: {
    boardId,
    data,
  },
});

fetchSummary.success = (boardId, item) => ({
  type: ActionTypes.METRICS_SUMMARY_FETCH__SUCCESS,
  payload: {
    boardId,
    item,
  },
});

fetchSummary.failure = (boardId, error) => ({
  type: ActionTypes.METRICS_SUMMARY_FETCH__FAILURE,
  payload: {
    boardId,
    error,
  },
});

export default {
  fetchCfd,
  fetchLeadTime,
  fetchThroughput,
  fetchWipAging,
  fetchSummary,
};
