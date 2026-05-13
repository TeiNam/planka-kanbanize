/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createSwimLane = (boardId, data, headers) =>
  socket.post(`/boards/${boardId}/swim-lanes`, data, headers);

const updateSwimLane = (id, data, headers) => socket.patch(`/swim-lanes/${id}`, data, headers);

const deleteSwimLane = (id, headers) => socket.delete(`/swim-lanes/${id}`, undefined, headers);

const sortSwimLanes = (id, data, headers) => socket.post(`/swim-lanes/${id}/sort`, data, headers);

export default {
  createSwimLane,
  updateSwimLane,
  deleteSwimLane,
  sortSwimLanes,
};
