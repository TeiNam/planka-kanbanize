/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createDecoratorInCurrentBoard = (data) => ({
  type: EntryActionTypes.DECORATOR_IN_CURRENT_BOARD_CREATE,
  payload: {
    data,
  },
});

const handleDecoratorCreate = (decorator) => ({
  type: EntryActionTypes.DECORATOR_CREATE_HANDLE,
  payload: {
    decorator,
  },
});

const updateDecorator = (id, data) => ({
  type: EntryActionTypes.DECORATOR_UPDATE,
  payload: {
    id,
    data,
  },
});

const handleDecoratorUpdate = (decorator) => ({
  type: EntryActionTypes.DECORATOR_UPDATE_HANDLE,
  payload: {
    decorator,
  },
});

const deleteDecorator = (id) => ({
  type: EntryActionTypes.DECORATOR_DELETE,
  payload: {
    id,
  },
});

const handleDecoratorDelete = (decorator) => ({
  type: EntryActionTypes.DECORATOR_DELETE_HANDLE,
  payload: {
    decorator,
  },
});

export default {
  createDecoratorInCurrentBoard,
  handleDecoratorCreate,
  updateDecorator,
  handleDecoratorUpdate,
  deleteDecorator,
  handleDecoratorDelete,
};
