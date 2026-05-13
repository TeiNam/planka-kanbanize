/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put } from 'redux-saga/effects';

import request from '../request';
import actions from '../../../actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

export function* createBlocker(cardId, data) {
  const localId = yield call(createLocalId);

  yield put(
    actions.createBlocker({
      ...data,
      cardId,
      id: localId,
    }),
  );

  let blocker;
  try {
    ({ item: blocker } = yield call(request, api.createBlocker, cardId, data));
  } catch (error) {
    yield put(actions.createBlocker.failure(localId, error));
    return;
  }

  yield put(actions.createBlocker.success(localId, blocker));
}

export function* handleBlockerCreate(blocker) {
  yield put(actions.handleBlockerCreate(blocker));
}

export function* updateBlocker(id, data) {
  yield put(actions.updateBlocker(id, data));

  let blocker;
  try {
    ({ item: blocker } = yield call(request, api.updateBlocker, id, data));
  } catch (error) {
    yield put(actions.updateBlocker.failure(id, error));
    return;
  }

  yield put(actions.updateBlocker.success(blocker));
}

export function* handleBlockerUpdate(blocker) {
  yield put(actions.handleBlockerUpdate(blocker));
}

export function* deleteBlocker(id) {
  yield put(actions.deleteBlocker(id));

  let blocker;
  try {
    ({ item: blocker } = yield call(request, api.deleteBlocker, id));
  } catch (error) {
    yield put(actions.deleteBlocker.failure(id, error));
    return;
  }

  yield put(actions.deleteBlocker.success(blocker));
}

export function* handleBlockerDelete(blocker) {
  yield put(actions.handleBlockerDelete(blocker));
}

export default {
  createBlocker,
  handleBlockerCreate,
  updateBlocker,
  handleBlockerUpdate,
  deleteBlocker,
  handleBlockerDelete,
};
