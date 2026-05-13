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
  MAX_COMMITMENT_POINTS_REACHED: {
    maxCommitmentPointsReached: 'Maximum 5 commitment points allowed per board',
  },
  LEFT_LIST_NOT_FOUND: {
    leftListNotFound: 'Left list not found',
  },
  RIGHT_LIST_NOT_FOUND: {
    rightListNotFound: 'Right list not found',
  },
  LISTS_NOT_ADJACENT: {
    listsNotAdjacent: 'Left list must have a lower position than right list',
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
    label: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 50,
      allowNull: true,
    },
    type: {
      type: 'string',
      isIn: Object.values(CommitmentPoint.Types),
    },
    leftListId: {
      ...idInput,
      required: true,
    },
    rightListId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    boardNotFound: {
      responseType: 'notFound',
    },
    maxCommitmentPointsReached: {
      responseType: 'conflict',
    },
    leftListNotFound: {
      responseType: 'notFound',
    },
    rightListNotFound: {
      responseType: 'notFound',
    },
    listsNotAdjacent: {
      responseType: 'unprocessableEntity',
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

    const values = _.pick(inputs, ['position', 'label', 'type', 'leftListId', 'rightListId']);

    const commitmentPoint = await sails.helpers.commitmentPoints.createOne
      .with({
        project,
        values: {
          ...values,
          board,
        },
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('maxCommitmentPointsReached', () => Errors.MAX_COMMITMENT_POINTS_REACHED)
      .intercept('leftListNotFound', () => Errors.LEFT_LIST_NOT_FOUND)
      .intercept('rightListNotFound', () => Errors.RIGHT_LIST_NOT_FOUND)
      .intercept('listsNotAdjacent', () => Errors.LISTS_NOT_ADJACENT);

    return {
      item: commitmentPoint,
    };
  },
};
