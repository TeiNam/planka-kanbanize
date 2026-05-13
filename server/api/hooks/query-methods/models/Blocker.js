/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria, { sort = 'id' } = {}) => Blocker.find(criteria).sort(sort);

/* Query methods */

const createOne = (values) => Blocker.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByCardId = (cardId) =>
  defaultFind({
    cardId,
  });

const getByCardIds = (cardIds) =>
  defaultFind({
    cardId: cardIds,
  });

const getOneById = (id, { cardId } = {}) => {
  const criteria = {
    id,
  };

  if (cardId) {
    criteria.cardId = cardId;
  }

  return Blocker.findOne(criteria);
};

const updateOne = (criteria, values) => Blocker.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => Blocker.destroy(criteria).fetch();

const deleteOne = (criteria) => Blocker.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByCardId,
  getByCardIds,
  getOneById,
  updateOne,
  deleteOne,
  delete: delete_,
};
