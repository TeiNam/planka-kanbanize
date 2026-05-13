/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const fetchCfd = (boardId, data, headers) =>
  socket.get(`/boards/${boardId}/metrics/cfd`, data, headers);

const fetchLeadTime = (boardId, data, headers) =>
  socket.get(`/boards/${boardId}/metrics/lead-time`, data, headers);

const fetchThroughput = (boardId, data, headers) =>
  socket.get(`/boards/${boardId}/metrics/throughput`, data, headers);

const fetchWipAging = (boardId, data, headers) =>
  socket.get(`/boards/${boardId}/metrics/wip-aging`, data, headers);

const fetchSummary = (boardId, data, headers) =>
  socket.get(`/boards/${boardId}/metrics/summary`, data, headers);

export default {
  fetchCfd,
  fetchLeadTime,
  fetchThroughput,
  fetchWipAging,
  fetchSummary,
};
