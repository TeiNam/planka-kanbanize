/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => CardMovementLog.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => CardMovementLog.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByCardId = (cardId) =>
  defaultFind({
    cardId,
  });

const getByCardIds = (cardIds) =>
  defaultFind({
    cardId: cardIds,
  });

const getByBoardId = (boardId) =>
  defaultFind({
    boardId,
  });

const getOneById = (id) => CardMovementLog.findOne({ id });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CardMovementLog.destroy(criteria).fetch();

const deleteOne = (criteria) => CardMovementLog.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByCardId,
  getByCardIds,
  getByBoardId,
  getOneById,
  deleteOne,
  delete: delete_,
};
