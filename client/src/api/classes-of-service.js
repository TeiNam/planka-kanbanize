/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createClassOfService = (boardId, data, headers) =>
  socket.post(`/boards/${boardId}/classes-of-service`, data, headers);

const updateClassOfService = (id, data, headers) =>
  socket.patch(`/classes-of-service/${id}`, data, headers);

const deleteClassOfService = (id, headers) =>
  socket.delete(`/classes-of-service/${id}`, undefined, headers);

export default {
  createClassOfService,
  updateClassOfService,
  deleteClassOfService,
};
