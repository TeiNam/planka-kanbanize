/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createDecorator = (decorator) => ({
  type: ActionTypes.DECORATOR_CREATE,
  payload: {
    decorator,
  },
});

createDecorator.success = (localId, decorator) => ({
  type: ActionTypes.DECORATOR_CREATE__SUCCESS,
  payload: {
    localId,
    decorator,
  },
});

createDecorator.failure = (localId, error) => ({
  type: ActionTypes.DECORATOR_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleDecoratorCreate = (decorator) => ({
  type: ActionTypes.DECORATOR_CREATE_HANDLE,
  payload: {
    decorator,
  },
});

const updateDecorator = (id, data) => ({
  type: ActionTypes.DECORATOR_UPDATE,
  payload: {
    id,
    data,
  },
});

updateDecorator.success = (decorator) => ({
  type: ActionTypes.DECORATOR_UPDATE__SUCCESS,
  payload: {
    decorator,
  },
});

updateDecorator.failure = (id, error) => ({
  type: ActionTypes.DECORATOR_UPDATE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleDecoratorUpdate = (decorator) => ({
  type: ActionTypes.DECORATOR_UPDATE_HANDLE,
  payload: {
    decorator,
  },
});

const deleteDecorator = (id) => ({
  type: ActionTypes.DECORATOR_DELETE,
  payload: {
    id,
  },
});

deleteDecorator.success = (decorator) => ({
  type: ActionTypes.DECORATOR_DELETE__SUCCESS,
  payload: {
    decorator,
  },
});

deleteDecorator.failure = (id, error) => ({
  type: ActionTypes.DECORATOR_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleDecoratorDelete = (decorator) => ({
  type: ActionTypes.DECORATOR_DELETE_HANDLE,
  payload: {
    decorator,
  },
});

export default {
  createDecorator,
  handleDecoratorCreate,
  updateDecorator,
  handleDecoratorUpdate,
  deleteDecorator,
  handleDecoratorDelete,
};
