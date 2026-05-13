/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createBlockerLinkedCard = (blockerId, data, headers) =>
  socket.post(`/blockers/${blockerId}/linked-cards`, data, headers);

const deleteBlockerLinkedCard = (id, headers) =>
  socket.delete(`/blocker-linked-cards/${id}`, undefined, headers);

export default {
  createBlockerLinkedCard,
  deleteBlockerLinkedCard,
};
