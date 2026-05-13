/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put } from 'redux-saga/effects';

import request from '../request';
import actions from '../../../actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

export function* createBlockerLinkedCard(blockerId, data) {
  const localId = yield call(createLocalId);

  yield put(
    actions.createBlockerLinkedCard({
      ...data,
      blockerId,
      id: localId,
    }),
  );

  let blockerLinkedCard;
  try {
    ({ item: blockerLinkedCard } = yield call(
      request,
      api.createBlockerLinkedCard,
      blockerId,
      data,
    ));
  } catch (error) {
    yield put(actions.createBlockerLinkedCard.failure(localId, error));
    return;
  }

  yield put(actions.createBlockerLinkedCard.success(localId, blockerLinkedCard));
}

export function* handleBlockerLinkedCardCreate(blockerLinkedCard) {
  yield put(actions.handleBlockerLinkedCardCreate(blockerLinkedCard));
}

export function* deleteBlockerLinkedCard(id) {
  yield put(actions.deleteBlockerLinkedCard(id));

  let blockerLinkedCard;
  try {
    ({ item: blockerLinkedCard } = yield call(request, api.deleteBlockerLinkedCard, id));
  } catch (error) {
    yield put(actions.deleteBlockerLinkedCard.failure(id, error));
    return;
  }

  yield put(actions.deleteBlockerLinkedCard.success(blockerLinkedCard));
}

export function* handleBlockerLinkedCardDelete(blockerLinkedCard) {
  yield put(actions.handleBlockerLinkedCardDelete(blockerLinkedCard));
}

export default {
  createBlockerLinkedCard,
  handleBlockerLinkedCardCreate,
  deleteBlockerLinkedCard,
  handleBlockerLinkedCardDelete,
};
