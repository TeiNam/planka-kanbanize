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

export function* createClassOfService(boardId, data) {
  const localId = yield call(createLocalId);

  yield put(
    actions.createClassOfService({
      ...data,
      boardId,
      id: localId,
    }),
  );

  let classOfService;
  try {
    ({ item: classOfService } = yield call(request, api.createClassOfService, boardId, data));
  } catch (error) {
    yield put(actions.createClassOfService.failure(localId, error));
    return;
  }

  yield put(actions.createClassOfService.success(localId, classOfService));
}

export function* createClassOfServiceInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(createClassOfService, boardId, data);
}

export function* handleClassOfServiceCreate(classOfService) {
  yield put(actions.handleClassOfServiceCreate(classOfService));
}

export function* updateClassOfService(id, data) {
  yield put(actions.updateClassOfService(id, data));

  let classOfService;
  try {
    ({ item: classOfService } = yield call(request, api.updateClassOfService, id, data));
  } catch (error) {
    yield put(actions.updateClassOfService.failure(id, error));
    return;
  }

  yield put(actions.updateClassOfService.success(classOfService));
}

export function* handleClassOfServiceUpdate(classOfService) {
  yield put(actions.handleClassOfServiceUpdate(classOfService));
}

export function* deleteClassOfService(id) {
  yield put(actions.deleteClassOfService(id));

  let classOfService;
  try {
    ({ item: classOfService } = yield call(request, api.deleteClassOfService, id));
  } catch (error) {
    yield put(actions.deleteClassOfService.failure(id, error));
    return;
  }

  yield put(actions.deleteClassOfService.success(classOfService));
}

export function* handleClassOfServiceDelete(classOfService) {
  yield put(actions.handleClassOfServiceDelete(classOfService));
}

export default {
  createClassOfService,
  createClassOfServiceInCurrentBoard,
  handleClassOfServiceCreate,
  updateClassOfService,
  handleClassOfServiceUpdate,
  deleteClassOfService,
  handleClassOfServiceDelete,
};
