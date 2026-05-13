/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria, { sort = 'id' } = {}) => Decorator.find(criteria).sort(sort);

/* Query methods */

const createOne = (values) => Decorator.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByBoardId = (boardId) =>
  defaultFind({
    boardId,
  });

const getOneById = (id, { boardId } = {}) => {
  const criteria = {
    id,
  };

  if (boardId) {
    criteria.boardId = boardId;
  }

  return Decorator.findOne(criteria);
};

const updateOne = (criteria, values) => Decorator.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => Decorator.destroy(criteria).fetch();

const deleteOne = (criteria) => Decorator.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByBoardId,
  getOneById,
  updateOne,
  deleteOne,
  delete: delete_,
};
