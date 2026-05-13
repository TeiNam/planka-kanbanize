/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* swimLanesWatchers() {
  yield all([
    takeEvery(EntryActionTypes.SWIM_LANE_IN_CURRENT_BOARD_CREATE, ({ payload: { data } }) =>
      services.createSwimLaneInCurrentBoard(data),
    ),
    takeEvery(EntryActionTypes.SWIM_LANE_CREATE_HANDLE, ({ payload: { swimLane } }) =>
      services.handleSwimLaneCreate(swimLane),
    ),
    takeEvery(EntryActionTypes.SWIM_LANE_UPDATE, ({ payload: { id, data } }) =>
      services.updateSwimLane(id, data),
    ),
    takeEvery(EntryActionTypes.SWIM_LANE_UPDATE_HANDLE, ({ payload: { swimLane } }) =>
      services.handleSwimLaneUpdate(swimLane),
    ),
    takeEvery(EntryActionTypes.SWIM_LANE_SORT, ({ payload: { id, data } }) =>
      services.sortSwimLanes(id, data),
    ),
    takeEvery(EntryActionTypes.SWIM_LANE_DELETE, ({ payload: { id } }) =>
      services.deleteSwimLane(id),
    ),
    takeEvery(EntryActionTypes.SWIM_LANE_DELETE_HANDLE, ({ payload: { swimLane } }) =>
      services.handleSwimLaneDelete(swimLane),
    ),
  ]);
}
