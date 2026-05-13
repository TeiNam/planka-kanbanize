/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createBlocker = (cardId, data) => ({
  type: EntryActionTypes.BLOCKER_CREATE,
  payload: {
    cardId,
    data,
  },
});

const handleBlockerCreate = (blocker) => ({
  type: EntryActionTypes.BLOCKER_CREATE_HANDLE,
  payload: {
    blocker,
  },
});

const updateBlocker = (id, data) => ({
  type: EntryActionTypes.BLOCKER_UPDATE,
  payload: {
    id,
    data,
  },
});

const handleBlockerUpdate = (blocker) => ({
  type: EntryActionTypes.BLOCKER_UPDATE_HANDLE,
  payload: {
    blocker,
  },
});

const deleteBlocker = (id) => ({
  type: EntryActionTypes.BLOCKER_DELETE,
  payload: {
    id,
  },
});

const handleBlockerDelete = (blocker) => ({
  type: EntryActionTypes.BLOCKER_DELETE_HANDLE,
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
