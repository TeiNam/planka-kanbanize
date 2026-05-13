/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createClassOfServiceInCurrentBoard = (data) => ({
  type: EntryActionTypes.CLASS_OF_SERVICE_IN_CURRENT_BOARD_CREATE,
  payload: {
    data,
  },
});

const handleClassOfServiceCreate = (classOfService) => ({
  type: EntryActionTypes.CLASS_OF_SERVICE_CREATE_HANDLE,
  payload: {
    classOfService,
  },
});

const updateClassOfService = (id, data) => ({
  type: EntryActionTypes.CLASS_OF_SERVICE_UPDATE,
  payload: {
    id,
    data,
  },
});

const handleClassOfServiceUpdate = (classOfService) => ({
  type: EntryActionTypes.CLASS_OF_SERVICE_UPDATE_HANDLE,
  payload: {
    classOfService,
  },
});

const deleteClassOfService = (id) => ({
  type: EntryActionTypes.CLASS_OF_SERVICE_DELETE,
  payload: {
    id,
  },
});

const handleClassOfServiceDelete = (classOfService) => ({
  type: EntryActionTypes.CLASS_OF_SERVICE_DELETE_HANDLE,
  payload: {
    classOfService,
  },
});

export default {
  createClassOfServiceInCurrentBoard,
  handleClassOfServiceCreate,
  updateClassOfService,
  handleClassOfServiceUpdate,
  deleteClassOfService,
  handleClassOfServiceDelete,
};
