/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createSwimLaneInCurrentBoard = (data) => ({
  type: EntryActionTypes.SWIM_LANE_IN_CURRENT_BOARD_CREATE,
  payload: {
    data,
  },
});

const handleSwimLaneCreate = (swimLane) => ({
  type: EntryActionTypes.SWIM_LANE_CREATE_HANDLE,
  payload: {
    swimLane,
  },
});

const updateSwimLane = (id, data) => ({
  type: EntryActionTypes.SWIM_LANE_UPDATE,
  payload: {
    id,
    data,
  },
});

const handleSwimLaneUpdate = (swimLane) => ({
  type: EntryActionTypes.SWIM_LANE_UPDATE_HANDLE,
  payload: {
    swimLane,
  },
});

const sortSwimLanes = (id, data) => ({
  type: EntryActionTypes.SWIM_LANE_SORT,
  payload: {
    id,
    data,
  },
});

const deleteSwimLane = (id) => ({
  type: EntryActionTypes.SWIM_LANE_DELETE,
  payload: {
    id,
  },
});

const handleSwimLaneDelete = (swimLane) => ({
  type: EntryActionTypes.SWIM_LANE_DELETE_HANDLE,
  payload: {
    swimLane,
  },
});

export default {
  createSwimLaneInCurrentBoard,
  handleSwimLaneCreate,
  updateSwimLane,
  handleSwimLaneUpdate,
  sortSwimLanes,
  deleteSwimLane,
  handleSwimLaneDelete,
};
