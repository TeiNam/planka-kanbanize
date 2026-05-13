/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createCardRelationship = (cardRelationship) => ({
  type: ActionTypes.CARD_RELATIONSHIP_CREATE,
  payload: {
    cardRelationship,
  },
});

createCardRelationship.success = (localId, cardRelationship) => ({
  type: ActionTypes.CARD_RELATIONSHIP_CREATE__SUCCESS,
  payload: {
    localId,
    cardRelationship,
  },
});

createCardRelationship.failure = (localId, error) => ({
  type: ActionTypes.CARD_RELATIONSHIP_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleCardRelationshipCreate = (cardRelationship) => ({
  type: ActionTypes.CARD_RELATIONSHIP_CREATE_HANDLE,
  payload: {
    cardRelationship,
  },
});

const sortCardRelationships = (cardId, data) => ({
  type: ActionTypes.CARD_RELATIONSHIP_SORT,
  payload: {
    cardId,
    data,
  },
});

sortCardRelationships.success = (cardRelationships) => ({
  type: ActionTypes.CARD_RELATIONSHIP_SORT__SUCCESS,
  payload: {
    cardRelationships,
  },
});

sortCardRelationships.failure = (cardId, error) => ({
  type: ActionTypes.CARD_RELATIONSHIP_SORT__FAILURE,
  payload: {
    cardId,
    error,
  },
});

const deleteCardRelationship = (id) => ({
  type: ActionTypes.CARD_RELATIONSHIP_DELETE,
  payload: {
    id,
  },
});

deleteCardRelationship.success = (cardRelationship) => ({
  type: ActionTypes.CARD_RELATIONSHIP_DELETE__SUCCESS,
  payload: {
    cardRelationship,
  },
});

deleteCardRelationship.failure = (id, error) => ({
  type: ActionTypes.CARD_RELATIONSHIP_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleCardRelationshipDelete = (cardRelationship) => ({
  type: ActionTypes.CARD_RELATIONSHIP_DELETE_HANDLE,
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
