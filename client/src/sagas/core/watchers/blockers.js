/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* blockersWatchers() {
  yield all([
    takeEvery(EntryActionTypes.BLOCKER_CREATE, ({ payload: { cardId, data } }) =>
      services.createBlocker(cardId, data),
    ),
    takeEvery(EntryActionTypes.BLOCKER_CREATE_HANDLE, ({ payload: { blocker } }) =>
      services.handleBlockerCreate(blocker),
    ),
    takeEvery(EntryActionTypes.BLOCKER_UPDATE, ({ payload: { id, data } }) =>
      services.updateBlocker(id, data),
    ),
    takeEvery(EntryActionTypes.BLOCKER_UPDATE_HANDLE, ({ payload: { blocker } }) =>
      services.handleBlockerUpdate(blocker),
    ),
    takeEvery(EntryActionTypes.BLOCKER_DELETE, ({ payload: { id } }) => services.deleteBlocker(id)),
    takeEvery(EntryActionTypes.BLOCKER_DELETE_HANDLE, ({ payload: { blocker } }) =>
      services.handleBlockerDelete(blocker),
    ),
  ]);
}
