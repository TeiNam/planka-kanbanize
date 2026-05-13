/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createCardDecorator = (cardId, decoratorId) => ({
  type: EntryActionTypes.CARD_DECORATOR_CREATE,
  payload: {
    cardId,
    decoratorId,
  },
});

const handleCardDecoratorCreate = (cardDecorator) => ({
  type: EntryActionTypes.CARD_DECORATOR_CREATE_HANDLE,
  payload: {
    cardDecorator,
  },
});

const deleteCardDecorator = (id) => ({
  type: EntryActionTypes.CARD_DECORATOR_DELETE,
  payload: {
    id,
  },
});

const handleCardDecoratorDelete = (cardDecorator) => ({
  type: EntryActionTypes.CARD_DECORATOR_DELETE_HANDLE,
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
