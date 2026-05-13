/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createBlockerLinkedCard = (blockerLinkedCard) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_CREATE,
  payload: {
    blockerLinkedCard,
  },
});

createBlockerLinkedCard.success = (localId, blockerLinkedCard) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_CREATE__SUCCESS,
  payload: {
    localId,
    blockerLinkedCard,
  },
});

createBlockerLinkedCard.failure = (localId, error) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleBlockerLinkedCardCreate = (blockerLinkedCard) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_CREATE_HANDLE,
  payload: {
    blockerLinkedCard,
  },
});

const deleteBlockerLinkedCard = (id) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_DELETE,
  payload: {
    id,
  },
});

deleteBlockerLinkedCard.success = (blockerLinkedCard) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_DELETE__SUCCESS,
  payload: {
    blockerLinkedCard,
  },
});

deleteBlockerLinkedCard.failure = (id, error) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleBlockerLinkedCardDelete = (blockerLinkedCard) => ({
  type: ActionTypes.BLOCKER_LINKED_CARD_DELETE_HANDLE,
  payload: {
    blockerLinkedCard,
  },
});

export default {
  createBlockerLinkedCard,
  handleBlockerLinkedCardCreate,
  deleteBlockerLinkedCard,
  handleBlockerLinkedCardDelete,
};
