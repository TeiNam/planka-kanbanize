/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put, select } from 'redux-saga/effects';

import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

export function* createCommitmentPoint(boardId, data) {
  const localId = yield call(createLocalId);

  yield put(
    actions.createCommitmentPoint({
      ...data,
      boardId,
      id: localId,
    }),
  );

  let commitmentPoint;
  try {
    ({ item: commitmentPoint } = yield call(request, api.createCommitmentPoint, boardId, data));
  } catch (error) {
    yield put(actions.createCommitmentPoint.failure(localId, error));
    return;
  }

  yield put(actions.createCommitmentPoint.success(localId, commitmentPoint));
}

export function* createCommitmentPointInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(createCommitmentPoint, boardId, data);
}

export function* handleCommitmentPointCreate(commitmentPoint) {
  yield put(actions.handleCommitmentPointCreate(commitmentPoint));
}

export function* updateCommitmentPoint(id, data) {
  yield put(actions.updateCommitmentPoint(id, data));

  let commitmentPoint;
  try {
    ({ item: commitmentPoint } = yield call(request, api.updateCommitmentPoint, id, data));
  } catch (error) {
    yield put(actions.updateCommitmentPoint.failure(id, error));
    return;
  }

  yield put(actions.updateCommitmentPoint.success(commitmentPoint));
}

export function* handleCommitmentPointUpdate(commitmentPoint) {
  yield put(actions.handleCommitmentPointUpdate(commitmentPoint));
}

export function* deleteCommitmentPoint(id) {
  yield put(actions.deleteCommitmentPoint(id));

  let commitmentPoint;
  try {
    ({ item: commitmentPoint } = yield call(request, api.deleteCommitmentPoint, id));
  } catch (error) {
    yield put(actions.deleteCommitmentPoint.failure(id, error));
    return;
  }

  yield put(actions.deleteCommitmentPoint.success(commitmentPoint));
}

export function* handleCommitmentPointDelete(commitmentPoint) {
  yield put(actions.handleCommitmentPointDelete(commitmentPoint));
}

export default {
  createCommitmentPoint,
  createCommitmentPointInCurrentBoard,
  handleCommitmentPointCreate,
  updateCommitmentPoint,
  handleCommitmentPointUpdate,
  deleteCommitmentPoint,
  handleCommitmentPointDelete,
};
