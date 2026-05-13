/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createCardDecorator = (cardId, decoratorId) => ({
  type: ActionTypes.CARD_DECORATOR_CREATE,
  payload: {
    cardId,
    decoratorId,
  },
});

createCardDecorator.success = (cardDecorator) => ({
  type: ActionTypes.CARD_DECORATOR_CREATE__SUCCESS,
  payload: {
    cardDecorator,
  },
});

createCardDecorator.failure = (cardId, decoratorId, error) => ({
  type: ActionTypes.CARD_DECORATOR_CREATE__FAILURE,
  payload: {
    cardId,
    decoratorId,
    error,
  },
});

const handleCardDecoratorCreate = (cardDecorator) => ({
  type: ActionTypes.CARD_DECORATOR_CREATE_HANDLE,
  payload: {
    cardDecorator,
  },
});

const deleteCardDecorator = (id) => ({
  type: ActionTypes.CARD_DECORATOR_DELETE,
  payload: {
    id,
  },
});

deleteCardDecorator.success = (cardDecorator) => ({
  type: ActionTypes.CARD_DECORATOR_DELETE__SUCCESS,
  payload: {
    cardDecorator,
  },
});

deleteCardDecorator.failure = (id, error) => ({
  type: ActionTypes.CARD_DECORATOR_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleCardDecoratorDelete = (cardDecorator) => ({
  type: ActionTypes.CARD_DECORATOR_DELETE_HANDLE,
  payload: {
    cardDecorator,
  },
});

export default {
  createCardDecorator,
  handleCardDecoratorCreate,
  deleteCardDecorator,
  handleCardDecoratorDelete,
};
