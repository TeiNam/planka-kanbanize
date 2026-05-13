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

export function* createDecorator(boardId, data) {
  const localId = yield call(createLocalId);

  yield put(
    actions.createDecorator({
      ...data,
      boardId,
      id: localId,
    }),
  );

  let decorator;
  try {
    ({ item: decorator } = yield call(request, api.createDecorator, boardId, data));
  } catch (error) {
    yield put(actions.createDecorator.failure(localId, error));
    return;
  }

  yield put(actions.createDecorator.success(localId, decorator));
}

export function* createDecoratorInCurrentBoard(data) {
  const { boardId } = yield select(selectors.selectPath);

  yield call(createDecorator, boardId, data);
}

export function* handleDecoratorCreate(decorator) {
  yield put(actions.handleDecoratorCreate(decorator));
}

export function* updateDecorator(id, data) {
  yield put(actions.updateDecorator(id, data));

  let decorator;
  try {
    ({ item: decorator } = yield call(request, api.updateDecorator, id, data));
  } catch (error) {
    yield put(actions.updateDecorator.failure(id, error));
    return;
  }

  yield put(actions.updateDecorator.success(decorator));
}

export function* handleDecoratorUpdate(decorator) {
  yield put(actions.handleDecoratorUpdate(decorator));
}

export function* deleteDecorator(id) {
  yield put(actions.deleteDecorator(id));

  let decorator;
  try {
    ({ item: decorator } = yield call(request, api.deleteDecorator, id));
  } catch (error) {
    yield put(actions.deleteDecorator.failure(id, error));
    return;
  }

  yield put(actions.deleteDecorator.success(decorator));
}

export function* handleDecoratorDelete(decorator) {
  yield put(actions.handleDecoratorDelete(decorator));
}

export default {
  createDecorator,
  createDecoratorInCurrentBoard,
  handleDecoratorCreate,
  updateDecorator,
  handleDecoratorUpdate,
  deleteDecorator,
  handleDecoratorDelete,
};
