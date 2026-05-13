/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createCardRelationship = (cardId, data) => ({
  type: EntryActionTypes.CARD_RELATIONSHIP_CREATE,
  payload: {
    cardId,
    data,
  },
});

const handleCardRelationshipCreate = (cardRelationship) => ({
  type: EntryActionTypes.CARD_RELATIONSHIP_CREATE_HANDLE,
  payload: {
    cardRelationship,
  },
});

const sortCardRelationships = (cardId, data) => ({
  type: EntryActionTypes.CARD_RELATIONSHIP_SORT,
  payload: {
    cardId,
    data,
  },
});

const deleteCardRelationship = (id) => ({
  type: EntryActionTypes.CARD_RELATIONSHIP_DELETE,
  payload: {
    id,
  },
});

const handleCardRelationshipDelete = (cardRelationship) => ({
  type: EntryActionTypes.CARD_RELATIONSHIP_DELETE_HANDLE,
  payload: {
    cardRelationship,
  },
});

export default {
  createCardRelationship,
  handleCardRelationshipCreate,
  sortCardRelationships,
  deleteCardRelationship,
  handleCardRelationshipDelete,
};
