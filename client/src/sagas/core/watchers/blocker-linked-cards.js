/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* blockerLinkedCardsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.BLOCKER_LINKED_CARD_CREATE, ({ payload: { blockerId, data } }) =>
      services.createBlockerLinkedCard(blockerId, data),
    ),
    takeEvery(
      EntryActionTypes.BLOCKER_LINKED_CARD_CREATE_HANDLE,
      ({ payload: { blockerLinkedCard } }) =>
        services.handleBlockerLinkedCardCreate(blockerLinkedCard),
    ),
    takeEvery(EntryActionTypes.BLOCKER_LINKED_CARD_DELETE, ({ payload: { id } }) =>
      services.deleteBlockerLinkedCard(id),
    ),
    takeEvery(
      EntryActionTypes.BLOCKER_LINKED_CARD_DELETE_HANDLE,
      ({ payload: { blockerLinkedCard } }) =>
        services.handleBlockerLinkedCardDelete(blockerLinkedCard),
    ),
  ]);
}
