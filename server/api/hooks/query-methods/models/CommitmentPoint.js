/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria, { sort = 'id' } = {}) => CommitmentPoint.find(criteria).sort(sort);

/* Query methods */

const createOne = (values) => CommitmentPoint.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByBoardId = (boardId, { exceptIdOrIds, sort = ['position', 'id'] } = {}) => {
  const criteria = {
    boardId,
  };

  if (exceptIdOrIds) {
    criteria.id = {
      '!=': exceptIdOrIds,
    };
  }

  return defaultFind(criteria, { sort });
};

const getOneById = (id, { boardId } = {}) => {
  const criteria = {
    id,
  };

  if (boardId) {
    criteria.boardId = boardId;
  }

  return CommitmentPoint.findOne(criteria);
};

const updateOne = (criteria, values) => CommitmentPoint.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CommitmentPoint.destroy(criteria).fetch();

const deleteOne = (criteria) => CommitmentPoint.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByBoardId,
  getOneById,
  updateOne,
  deleteOne,
  delete: delete_,
};
