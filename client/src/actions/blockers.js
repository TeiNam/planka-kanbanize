/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createBlocker = (blocker) => ({
  type: ActionTypes.BLOCKER_CREATE,
  payload: {
    blocker,
  },
});

createBlocker.success = (localId, blocker) => ({
  type: ActionTypes.BLOCKER_CREATE__SUCCESS,
  payload: {
    localId,
    blocker,
  },
});

createBlocker.failure = (localId, error) => ({
  type: ActionTypes.BLOCKER_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleBlockerCreate = (blocker) => ({
  type: ActionTypes.BLOCKER_CREATE_HANDLE,
  payload: {
    blocker,
  },
});

const updateBlocker = (id, data) => ({
  type: ActionTypes.BLOCKER_UPDATE,
  payload: {
    id,
    data,
  },
});

updateBlocker.success = (blocker) => ({
  type: ActionTypes.BLOCKER_UPDATE__SUCCESS,
  payload: {
    blocker,
  },
});

updateBlocker.failure = (id, error) => ({
  type: ActionTypes.BLOCKER_UPDATE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleBlockerUpdate = (blocker) => ({
  type: ActionTypes.BLOCKER_UPDATE_HANDLE,
  payload: {
    blocker,
  },
});

const deleteBlocker = (id) => ({
  type: ActionTypes.BLOCKER_DELETE,
  payload: {
    id,
  },
});

deleteBlocker.success = (blocker) => ({
  type: ActionTypes.BLOCKER_DELETE__SUCCESS,
  payload: {
    blocker,
  },
});

deleteBlocker.failure = (id, error) => ({
  type: ActionTypes.BLOCKER_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleBlockerDelete = (blocker) => ({
  type: ActionTypes.BLOCKER_DELETE_HANDLE,
  payload: {
    blocker,
  },
});

export default {
  createBlocker,
  handleBlockerCreate,
  updateBlocker,
  handleBlockerUpdate,
  deleteBlocker,
  handleBlockerDelete,
};
