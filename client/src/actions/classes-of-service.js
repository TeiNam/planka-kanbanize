/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createClassOfService = (classOfService) => ({
  type: ActionTypes.CLASS_OF_SERVICE_CREATE,
  payload: {
    classOfService,
  },
});

createClassOfService.success = (localId, classOfService) => ({
  type: ActionTypes.CLASS_OF_SERVICE_CREATE__SUCCESS,
  payload: {
    localId,
    classOfService,
  },
});

createClassOfService.failure = (localId, error) => ({
  type: ActionTypes.CLASS_OF_SERVICE_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleClassOfServiceCreate = (classOfService) => ({
  type: ActionTypes.CLASS_OF_SERVICE_CREATE_HANDLE,
  payload: {
    classOfService,
  },
});

const updateClassOfService = (id, data) => ({
  type: ActionTypes.CLASS_OF_SERVICE_UPDATE,
  payload: {
    id,
    data,
  },
});

updateClassOfService.success = (classOfService) => ({
  type: ActionTypes.CLASS_OF_SERVICE_UPDATE__SUCCESS,
  payload: {
    classOfService,
  },
});

updateClassOfService.failure = (id, error) => ({
  type: ActionTypes.CLASS_OF_SERVICE_UPDATE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleClassOfServiceUpdate = (classOfService) => ({
  type: ActionTypes.CLASS_OF_SERVICE_UPDATE_HANDLE,
  payload: {
    classOfService,
  },
});

const deleteClassOfService = (id) => ({
  type: ActionTypes.CLASS_OF_SERVICE_DELETE,
  payload: {
    id,
  },
});

deleteClassOfService.success = (classOfService) => ({
  type: ActionTypes.CLASS_OF_SERVICE_DELETE__SUCCESS,
  payload: {
    classOfService,
  },
});

deleteClassOfService.failure = (id, error) => ({
  type: ActionTypes.CLASS_OF_SERVICE_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleClassOfServiceDelete = (classOfService) => ({
  type: ActionTypes.CLASS_OF_SERVICE_DELETE_HANDLE,
  payload: {
    classOfService,
  },
});

export default {
  createClassOfService,
  handleClassOfServiceCreate,
  updateClassOfService,
  handleClassOfServiceUpdate,
  deleteClassOfService,
  handleClassOfServiceDelete,
};
