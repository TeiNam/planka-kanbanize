/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put } from 'redux-saga/effects';

import request from '../request';
import actions from '../../../actions';
import api from '../../../api';

export function* createCardDecorator(cardId, decoratorId) {
  yield put(actions.createCardDecorator(cardId, decoratorId));

  let cardDecorator;
  try {
    ({ item: cardDecorator } = yield call(request, api.createCardDecorator, cardId, {
      decoratorId,
    }));
  } catch (error) {
    yield put(actions.createCardDecorator.failure(cardId, decoratorId, error));
    return;
  }

  yield put(actions.createCardDecorator.success(cardDecorator));
}

export function* handleCardDecoratorCreate(cardDecorator) {
  yield put(actions.handleCardDecoratorCreate(cardDecorator));
}

export function* deleteCardDecorator(id) {
  yield put(actions.deleteCardDecorator(id));

  let cardDecorator;
  try {
    ({ item: cardDecorator } = yield call(request, api.deleteCardDecorator, id));
  } catch (error) {
    yield put(actions.deleteCardDecorator.failure(id, error));
    return;
  }

  yield put(actions.deleteCardDecorator.success(cardDecorator));
}

export function* handleCardDecoratorDelete(cardDecorator) {
  yield put(actions.handleCardDecoratorDelete(cardDecorator));
}

export default {
  createCardDecorator,
  handleCardDecoratorCreate,
  deleteCardDecorator,
  handleCardDecoratorDelete,
};
