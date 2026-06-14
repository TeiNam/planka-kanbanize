/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria, { sort = 'id' } = {}) => CalendarEvent.find(criteria).sort(sort);

/* Query methods */

const createOne = (values) => CalendarEvent.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByProjectId = (projectId, { exceptIdOrIds, sort = ['startAt', 'id'] } = {}) => {
  const criteria = {
    projectId,
  };

  if (exceptIdOrIds) {
    criteria.id = {
      '!=': exceptIdOrIds,
    };
  }

  return defaultFind(criteria, { sort });
};

const getOneById = (id, { projectId } = {}) => {
  const criteria = {
    id,
  };

  if (projectId) {
    criteria.projectId = projectId;
  }

  return CalendarEvent.findOne(criteria);
};

const updateOne = (criteria, values) => CalendarEvent.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CalendarEvent.destroy(criteria).fetch();

const deleteOne = (criteria) => CalendarEvent.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByProjectId,
  getOneById,
  updateOne,
  deleteOne,
  delete: delete_,
};
