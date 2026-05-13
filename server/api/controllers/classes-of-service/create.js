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
  MAX_CUSTOM_CLASSES_REACHED: {
    maxCustomClassesReached: 'Maximum 10 custom classes of service allowed per board',
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
      maxLength: 30,
      required: true,
    },
    color: {
      type: 'string',
      isIn: ClassOfService.COLORS,
      required: true,
    },
    policy: {
      type: 'string',
      maxLength: 500,
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
    maxCustomClassesReached: {
      responseType: 'conflict',
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

    const values = _.pick(inputs, ['position', 'name', 'color', 'policy']);

    const classOfService = await sails.helpers.classesOfService.createOne
      .with({
        project,
        values: {
          ...values,
          board,
          type: ClassOfService.Types.CUSTOM,
          isDefault: false,
        },
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('maxCustomClassesReached', () => Errors.MAX_CUSTOM_CLASSES_REACHED);

    return {
      item: classOfService,
    };
  },
};
