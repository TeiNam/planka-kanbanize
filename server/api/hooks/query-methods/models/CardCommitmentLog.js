/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => CardCommitmentLog.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => CardCommitmentLog.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByCardId = (cardId) =>
  defaultFind({
    cardId,
  });

const getByCardIds = (cardIds) =>
  defaultFind({
    cardId: cardIds,
  });

const getOneById = (id) => CardCommitmentLog.findOne({ id });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CardCommitmentLog.destroy(criteria).fetch();

const deleteOne = (criteria) => CardCommitmentLog.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByCardId,
  getByCardIds,
  getOneById,
  deleteOne,
  delete: delete_,
};
