/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createBlocker = (cardId, data, headers) =>
  socket.post(`/cards/${cardId}/blockers`, data, headers);

const updateBlocker = (id, data, headers) => socket.patch(`/blockers/${id}`, data, headers);

const deleteBlocker = (id, headers) => socket.delete(`/blockers/${id}`, undefined, headers);

export default {
  createBlocker,
  updateBlocker,
  deleteBlocker,
};
