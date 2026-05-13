/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => BlockerLinkedCard.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => BlockerLinkedCard.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByBlockerId = (blockerId) =>
  defaultFind({
    blockerId,
  });

const getByBlockerIds = (blockerIds) =>
  defaultFind({
    blockerId: blockerIds,
  });

const getByCardId = (cardId) =>
  defaultFind({
    cardId,
  });

const getByCardIds = (cardIds) =>
  defaultFind({
    cardId: cardIds,
  });

const getOneById = (id) => BlockerLinkedCard.findOne({ id });

const getOneByBlockerIdAndCardId = (blockerId, cardId) =>
  BlockerLinkedCard.findOne({
    blockerId,
    cardId,
  });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => BlockerLinkedCard.destroy(criteria).fetch();

const deleteOne = (criteria) => BlockerLinkedCard.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByBlockerId,
  getByBlockerIds,
  getByCardId,
  getByCardIds,
  getOneById,
  getOneByBlockerIdAndCardId,
  deleteOne,
  delete: delete_,
};
