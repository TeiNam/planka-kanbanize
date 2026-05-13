/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
};

module.exports = {
  inputs: {
    boardId: {
      ...idInput,
      required: true,
    },
    position: {
      type: 'number',
      min: 0,
      required: true,
    },
    name: {
      type: 'string',
      isNotEmptyString: true,
      minLength: 1,
      maxLength: 50,
      required: true,
    },
    category: {
      type: 'string',
      isIn: Object.values(SwimLane.Categories),
    },
    type: {
      type: 'string',
      isIn: Object.values(SwimLane.Types),
    },
    wipLimit: {
      type: 'number',
      min: 1,
      max: 100,
      isInteger: true,
      allowNull: true,
    },
    color: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    boardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const { board, project } = await sails.helpers.boards
      .getPathToProjectById(inputs.boardId)
      .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND);

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.BOARD_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, ['position', 'name', 'category', 'type', 'wipLimit', 'color']);

    const swimLane = await sails.helpers.swimLanes.createOne.with({
      project,
      values: {
        ...values,
        board,
      },
      actorUser: currentUser,
      request: this.req,
    });

    return {
      item: swimLane,
    };
  },
};
