/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createSwimLane = (swimLane) => ({
  type: ActionTypes.SWIM_LANE_CREATE,
  payload: {
    swimLane,
  },
});

createSwimLane.success = (localId, swimLane) => ({
  type: ActionTypes.SWIM_LANE_CREATE__SUCCESS,
  payload: {
    localId,
    swimLane,
  },
});

createSwimLane.failure = (localId, error) => ({
  type: ActionTypes.SWIM_LANE_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleSwimLaneCreate = (swimLane) => ({
  type: ActionTypes.SWIM_LANE_CREATE_HANDLE,
  payload: {
    swimLane,
  },
});

const updateSwimLane = (id, data) => ({
  type: ActionTypes.SWIM_LANE_UPDATE,
  payload: {
    id,
    data,
  },
});

updateSwimLane.success = (swimLane) => ({
  type: ActionTypes.SWIM_LANE_UPDATE__SUCCESS,
  payload: {
    swimLane,
  },
});

updateSwimLane.failure = (id, error) => ({
  type: ActionTypes.SWIM_LANE_UPDATE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleSwimLaneUpdate = (swimLane) => ({
  type: ActionTypes.SWIM_LANE_UPDATE_HANDLE,
  payload: {
    swimLane,
  },
});

const sortSwimLanes = (id, data) => ({
  type: ActionTypes.SWIM_LANE_SORT,
  payload: {
    id,
    data,
  },
});

sortSwimLanes.success = (swimLanes) => ({
  type: ActionTypes.SWIM_LANE_SORT__SUCCESS,
  payload: {
    swimLanes,
  },
});

sortSwimLanes.failure = (id, error) => ({
  type: ActionTypes.SWIM_LANE_SORT__FAILURE,
  payload: {
    id,
    error,
  },
});

const deleteSwimLane = (id) => ({
  type: ActionTypes.SWIM_LANE_DELETE,
  payload: {
    id,
  },
});

deleteSwimLane.success = (swimLane) => ({
  type: ActionTypes.SWIM_LANE_DELETE__SUCCESS,
  payload: {
    swimLane,
  },
});

deleteSwimLane.failure = (id, error) => ({
  type: ActionTypes.SWIM_LANE_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleSwimLaneDelete = (swimLane) => ({
  type: ActionTypes.SWIM_LANE_DELETE_HANDLE,
  payload: {
    swimLane,
  },
});

export default {
  createSwimLane,
  handleSwimLaneCreate,
  updateSwimLane,
  handleSwimLaneUpdate,
  sortSwimLanes,
  deleteSwimLane,
  handleSwimLaneDelete,
};
