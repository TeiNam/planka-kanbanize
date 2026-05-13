/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put, select } from 'redux-saga/effects';

import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';

export function* fetchCfd(boardId, data) {
  let item;
  try {
    ({ item } = yield call(request, api.fetchCfd, boardId, data));
  } catch (error) {
    yield put(actions.fetchCfd.failure(boardId, error));
    return;
  }

  yield put(actions.fetchCfd.success(boardId, item));
}

export function* fetchCfdInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(fetchCfd, boardId, data);
}

export function* fetchLeadTime(boardId, data) {
  let item;
  try {
    ({ item } = yield call(request, api.fetchLeadTime, boardId, data));
  } catch (error) {
    yield put(actions.fetchLeadTime.failure(boardId, error));
    return;
  }

  yield put(actions.fetchLeadTime.success(boardId, item));
}

export function* fetchLeadTimeInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(fetchLeadTime, boardId, data);
}

export function* fetchThroughput(boardId, data) {
  let item;
  try {
    ({ item } = yield call(request, api.fetchThroughput, boardId, data));
  } catch (error) {
    yield put(actions.fetchThroughput.failure(boardId, error));
    return;
  }

  yield put(actions.fetchThroughput.success(boardId, item));
}

export function* fetchThroughputInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(fetchThroughput, boardId, data);
}

export function* fetchWipAging(boardId, data) {
  let item;
  try {
    ({ item } = yield call(request, api.fetchWipAging, boardId, data));
  } catch (error) {
    yield put(actions.fetchWipAging.failure(boardId, error));
    return;
  }

  yield put(actions.fetchWipAging.success(boardId, item));
}

export function* fetchWipAgingInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(fetchWipAging, boardId, data);
}

export function* fetchSummary(boardId, data) {
  let item;
  try {
    ({ item } = yield call(request, api.fetchSummary, boardId, data));
  } catch (error) {
    yield put(actions.fetchSummary.failure(boardId, error));
    return;
  }

  yield put(actions.fetchSummary.success(boardId, item));
}

export function* fetchSummaryInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(fetchSummary, boardId, data);
}

export default {
  fetchCfd,
  fetchCfdInCurrentBoard,
  fetchLeadTime,
  fetchLeadTimeInCurrentBoard,
  fetchThroughput,
  fetchThroughputInCurrentBoard,
  fetchWipAging,
  fetchWipAgingInCurrentBoard,
  fetchSummary,
  fetchSummaryInCurrentBoard,
};
