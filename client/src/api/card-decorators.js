/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createCardDecorator = (cardId, data, headers) =>
  socket.post(`/cards/${cardId}/card-decorators`, data, headers);

const deleteCardDecorator = (id, headers) =>
  socket.delete(`/card-decorators/${id}`, undefined, headers);

export default {
  createCardDecorator,
  deleteCardDecorator,
};
