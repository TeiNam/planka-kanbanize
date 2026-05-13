/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put } from 'redux-saga/effects';

import request from '../request';
import actions from '../../../actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

export function* createCardRelationship(cardId, data) {
  const localId = yield call(createLocalId);

  yield put(
    actions.createCardRelationship({
      ...data,
      parentCardId: cardId,
      id: localId,
    }),
  );

  let cardRelationship;
  let included;
  try {
    ({ item: cardRelationship, included } = yield call(
      request,
      api.createCardRelationship,
      cardId,
      data,
    ));
  } catch (error) {
    yield put(actions.createCardRelationship.failure(localId, error));
    return;
  }

  if (included && included.cards) {
    yield put(actions.handleCardCreate(included.cards[0]));
  }

  yield put(actions.createCardRelationship.success(localId, cardRelationship));
}

export function* handleCardRelationshipCreate(cardRelationship) {
  yield put(actions.handleCardRelationshipCreate(cardRelationship));
}

export function* sortCardRelationships(cardId, data) {
  yield put(actions.sortCardRelationships(cardId, data));

  let cardRelationships;
  try {
    ({ items: cardRelationships } = yield call(request, api.sortCardRelationships, cardId, data));
  } catch (error) {
    yield put(actions.sortCardRelationships.failure(cardId, error));
    return;
  }

  yield put(actions.sortCardRelationships.success(cardRelationships));
}

export function* deleteCardRelationship(id) {
  yield put(actions.deleteCardRelationship(id));

  let cardRelationship;
  try {
    ({ item: cardRelationship } = yield call(request, api.deleteCardRelationship, id));
  } catch (error) {
    yield put(actions.deleteCardRelationship.failure(id, error));
    return;
  }

  yield put(actions.deleteCardRelationship.success(cardRelationship));
}

export function* handleCardRelationshipDelete(cardRelationship) {
  yield put(actions.handleCardRelationshipDelete(cardRelationship));
}

export default {
  createCardRelationship,
  handleCardRelationshipCreate,
  sortCardRelationships,
  deleteCardRelationship,
  handleCardRelationshipDelete,
};
