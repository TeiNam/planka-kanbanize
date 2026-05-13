/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => BoardDailySnapshot.find(criteria).sort('id');

/* Query methods */

const createOne = (values) => BoardDailySnapshot.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByBoardId = (boardId) =>
  defaultFind({
    boardId,
  });

const getByBoardIdAndDateRange = (boardId, startDate, endDate) =>
  BoardDailySnapshot.find({
    boardId,
    snapshotDate: { '>=': startDate, '<=': endDate },
  }).sort('snapshotDate ASC');

const getOneById = (id) => BoardDailySnapshot.findOne({ id });

const getOneByBoardIdAndListIdAndDate = (boardId, listId, snapshotDate) =>
  BoardDailySnapshot.findOne({ boardId, listId, snapshotDate });

const updateOne = (criteria, values) => BoardDailySnapshot.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => BoardDailySnapshot.destroy(criteria).fetch();

const deleteOne = (criteria) => BoardDailySnapshot.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByBoardId,
  getByBoardIdAndDateRange,
  getOneById,
  getOneByBoardIdAndListIdAndDate,
  updateOne,
  deleteOne,
  delete: delete_,
};
