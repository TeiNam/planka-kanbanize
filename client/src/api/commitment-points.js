/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createCommitmentPoint = (boardId, data, headers) =>
  socket.post(`/boards/${boardId}/commitment-points`, data, headers);

const updateCommitmentPoint = (id, data, headers) =>
  socket.patch(`/commitment-points/${id}`, data, headers);

const deleteCommitmentPoint = (id, headers) =>
  socket.delete(`/commitment-points/${id}`, undefined, headers);

export default {
  createCommitmentPoint,
  updateCommitmentPoint,
  deleteCommitmentPoint,
};
