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

export function* createSwimLane(boardId, data) {
  const localId = yield call(createLocalId);

  yield put(
    actions.createSwimLane({
      ...data,
      boardId,
      id: localId,
    }),
  );

  let swimLane;
  try {
    ({ item: swimLane } = yield call(request, api.createSwimLane, boardId, data));
  } catch (error) {
    yield put(actions.createSwimLane.failure(localId, error));
    return;
  }

  yield put(actions.createSwimLane.success(localId, swimLane));
}

export function* createSwimLaneInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(createSwimLane, boardId, data);
}

export function* handleSwimLaneCreate(swimLane) {
  yield put(actions.handleSwimLaneCreate(swimLane));
}

export function* updateSwimLane(id, data) {
  yield put(actions.updateSwimLane(id, data));

  let swimLane;
  try {
    ({ item: swimLane } = yield call(request, api.updateSwimLane, id, data));
  } catch (error) {
    yield put(actions.updateSwimLane.failure(id, error));
    return;
  }

  yield put(actions.updateSwimLane.success(swimLane));
}

export function* handleSwimLaneUpdate(swimLane) {
  yield put(actions.handleSwimLaneUpdate(swimLane));
}

export function* sortSwimLanes(id, data) {
  yield put(actions.sortSwimLanes(id, data));

  let swimLanes;
  try {
    ({ items: swimLanes } = yield call(request, api.sortSwimLanes, id, data));
  } catch (error) {
    yield put(actions.sortSwimLanes.failure(id, error));
    return;
  }

  yield put(actions.sortSwimLanes.success(swimLanes));
}

export function* deleteSwimLane(id) {
  yield put(actions.deleteSwimLane(id));

  let swimLane;
  try {
    ({ item: swimLane } = yield call(request, api.deleteSwimLane, id));
  } catch (error) {
    yield put(actions.deleteSwimLane.failure(id, error));
    return;
  }

  yield put(actions.deleteSwimLane.success(swimLane));
}

export function* handleSwimLaneDelete(swimLane) {
  yield put(actions.handleSwimLaneDelete(swimLane));
}

export default {
  createSwimLane,
  createSwimLaneInCurrentBoard,
  handleSwimLaneCreate,
  updateSwimLane,
  handleSwimLaneUpdate,
  sortSwimLanes,
  deleteSwimLane,
  handleSwimLaneDelete,
};
