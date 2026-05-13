/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createCardRelationship = (cardId, data, headers) =>
  socket.post(`/cards/${cardId}/card-relationships`, data, headers);

const deleteCardRelationship = (id, headers) =>
  socket.delete(`/card-relationships/${id}`, undefined, headers);

const sortCardRelationships = (cardId, data, headers) =>
  socket.post(`/cards/${cardId}/relationships/sort`, data, headers);

export default {
  createCardRelationship,
  deleteCardRelationship,
  sortCardRelationships,
};
