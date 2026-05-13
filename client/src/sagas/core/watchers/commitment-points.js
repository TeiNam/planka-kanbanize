/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* commitmentPointsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.COMMITMENT_POINT_IN_CURRENT_BOARD_CREATE, ({ payload: { data } }) =>
      services.createCommitmentPointInCurrentBoard(data),
    ),
    takeEvery(EntryActionTypes.COMMITMENT_POINT_CREATE_HANDLE, ({ payload: { commitmentPoint } }) =>
      services.handleCommitmentPointCreate(commitmentPoint),
    ),
    takeEvery(EntryActionTypes.COMMITMENT_POINT_UPDATE, ({ payload: { id, data } }) =>
      services.updateCommitmentPoint(id, data),
    ),
    takeEvery(EntryActionTypes.COMMITMENT_POINT_UPDATE_HANDLE, ({ payload: { commitmentPoint } }) =>
      services.handleCommitmentPointUpdate(commitmentPoint),
    ),
    takeEvery(EntryActionTypes.COMMITMENT_POINT_DELETE, ({ payload: { id } }) =>
      services.deleteCommitmentPoint(id),
    ),
    takeEvery(EntryActionTypes.COMMITMENT_POINT_DELETE_HANDLE, ({ payload: { commitmentPoint } }) =>
      services.handleCommitmentPointDelete(commitmentPoint),
    ),
  ]);
}
