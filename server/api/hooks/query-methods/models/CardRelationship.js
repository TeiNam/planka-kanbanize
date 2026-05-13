/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria, { sort = 'id' } = {}) => CardRelationship.find(criteria).sort(sort);

/* Query methods */

const createOne = (values) => CardRelationship.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getByParentCardId = (
  parentCardId,
  { type, exceptIdOrIds, sort = ['position', 'id'] } = {},
) => {
  const criteria = {
    parentCardId,
  };

  if (type) {
    criteria.type = type;
  }

  if (exceptIdOrIds) {
    criteria.id = {
      '!=': exceptIdOrIds,
    };
  }

  return defaultFind(criteria, { sort });
};

const getByParentCardIds = (parentCardIds) =>
  defaultFind({
    parentCardId: parentCardIds,
  });

const getByChildCardId = (childCardId, { type } = {}) => {
  const criteria = {
    childCardId,
  };

  if (type) {
    criteria.type = type;
  }

  return defaultFind(criteria);
};

const getOneById = (id) => CardRelationship.findOne({ id });

const updateOne = (criteria, values) => CardRelationship.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CardRelationship.destroy(criteria).fetch();

const deleteOne = (criteria) => CardRelationship.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByParentCardId,
  getByParentCardIds,
  getByChildCardId,
  getOneById,
  updateOne,
  deleteOne,
  delete: delete_,
};
