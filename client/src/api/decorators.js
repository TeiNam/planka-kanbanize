/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createDecorator = (boardId, data, headers) =>
  socket.post(`/boards/${boardId}/decorators`, data, headers);

const updateDecorator = (id, data, headers) => socket.patch(`/decorators/${id}`, data, headers);

const deleteDecorator = (id, headers) => socket.delete(`/decorators/${id}`, undefined, headers);

export default {
  createDecorator,
  updateDecorator,
  deleteDecorator,
};
