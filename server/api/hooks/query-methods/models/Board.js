/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria, { sort = 'id' } = {}) => Board.find(criteria).sort(sort);

/* Query methods */

const createOne = (values, { user } = {}) =>
  sails.getDatastore().transaction(async (db) => {
    const board = await Board.create({ ...values })
      .fetch()
      .usingConnection(db);

    const boardMembership = await BoardMembership.create({
      projectId: board.projectId,
      boardId: board.id,
      userId: user.id,
      role: BoardMembership.Roles.EDITOR,
    })
      .fetch()
      .usingConnection(db);

    const lists = await List.createEach(
      [List.Types.ARCHIVE, List.Types.TRASH].map((type) => ({
        type,
        boardId: board.id,
      })),
    )
      .fetch()
      .usingConnection(db);

    return { board, boardMembership, lists };
  });

const getByIds = (ids, { exceptProjectIdOrIds } = {}) => {
  const criteria = {
    id: ids,
  };

  if (exceptProjectIdOrIds) {
    criteria.projectId = {
      '!=': exceptProjectIdOrIds,
    };
  }

  return defaultFind(criteria);
};

const getByProjectId = (projectId, { exceptIdOrIds, sort = ['position', 'id'] } = {}) => {
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

const getByProjectIds = (projectIds, { sort = ['position', 'id'] } = {}) =>
  defaultFind(
    {
      projectId: projectIds,
    },
    { sort },
  );

const getOneById = (id) => Board.findOne(id);

const updateOne = (criteria, values) => Board.updateOne(criteria).set({ ...values });

// 카드 말머리 순번을 원자적으로 점유한다.
// card_prefix_next_number 를 1 증가시키고, 이번 카드에 사용할 번호(증가 전 값)를 반환한다.
// 동시 카드 생성 시에도 번호가 중복되지 않도록 단일 UPDATE ... RETURNING 으로 처리한다.
const claimCardPrefixNumber = async (id) => {
  const queryResult = await sails.sendNativeQuery(
    'UPDATE board SET card_prefix_next_number = card_prefix_next_number + 1 WHERE id = $1 RETURNING card_prefix_next_number',
    [id],
  );

  if (!queryResult.rows || queryResult.rows.length === 0) {
    return null;
  }

  return Number(queryResult.rows[0].card_prefix_next_number) - 1;
};

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => Board.destroy(criteria).fetch();

const deleteOne = (criteria) => Board.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByProjectId,
  getByProjectIds,
  getOneById,
  updateOne,
  claimCardPrefixNumber,
  deleteOne,
  delete: delete_,
};
