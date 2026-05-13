/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createBlockerLinkedCard = (blockerId, data) => ({
  type: EntryActionTypes.BLOCKER_LINKED_CARD_CREATE,
  payload: {
    blockerId,
    data,
  },
});

const handleBlockerLinkedCardCreate = (blockerLinkedCard) => ({
  type: EntryActionTypes.BLOCKER_LINKED_CARD_CREATE_HANDLE,
  payload: {
    blockerLinkedCard,
  },
});

const deleteBlockerLinkedCard = (id) => ({
  type: EntryActionTypes.BLOCKER_LINKED_CARD_DELETE,
  payload: {
    id,
  },
});

const handleBlockerLinkedCardDelete = (blockerLinkedCard) => ({
  type: EntryActionTypes.BLOCKER_LINKED_CARD_DELETE_HANDLE,
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
