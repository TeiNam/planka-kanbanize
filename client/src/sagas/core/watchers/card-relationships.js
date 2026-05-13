/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* cardRelationshipsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.CARD_RELATIONSHIP_CREATE, ({ payload: { cardId, data } }) =>
      services.createCardRelationship(cardId, data),
    ),
    takeEvery(
      EntryActionTypes.CARD_RELATIONSHIP_CREATE_HANDLE,
      ({ payload: { cardRelationship } }) =>
        services.handleCardRelationshipCreate(cardRelationship),
    ),
    takeEvery(EntryActionTypes.CARD_RELATIONSHIP_SORT, ({ payload: { cardId, data } }) =>
      services.sortCardRelationships(cardId, data),
    ),
    takeEvery(EntryActionTypes.CARD_RELATIONSHIP_DELETE, ({ payload: { id } }) =>
      services.deleteCardRelationship(id),
    ),
    takeEvery(
      EntryActionTypes.CARD_RELATIONSHIP_DELETE_HANDLE,
      ({ payload: { cardRelationship } }) =>
        services.handleCardRelationshipDelete(cardRelationship),
    ),
  ]);
}
