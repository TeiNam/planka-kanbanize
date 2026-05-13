/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => CardDecorator.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => CardDecorator.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByCardId = (cardId) =>
  defaultFind({
    cardId,
  });

const getByCardIds = (cardIds) =>
  defaultFind({
    cardId: cardIds,
  });

const getOneById = (id) => CardDecorator.findOne({ id });

const getOneByCardIdAndDecoratorId = (cardId, decoratorId) =>
  CardDecorator.findOne({
    cardId,
    decoratorId,
  });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CardDecorator.destroy(criteria).fetch();

const deleteOne = (criteria) => CardDecorator.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByCardId,
  getByCardIds,
  getOneById,
  getOneByCardIdAndDecoratorId,
  deleteOne,
  delete: delete_,
};
