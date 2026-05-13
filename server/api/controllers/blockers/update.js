/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  BLOCKER_NOT_FOUND: {
    blockerNotFound: 'Blocker not found',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
    status: {
      type: 'string',
      isIn: Object.values(Blocker.Statuses),
    },
    reason: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 200,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    blockerNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.blockers
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.BLOCKER_NOT_FOUND);

    let { blocker } = pathToProject;
    const { card, board, project } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.BLOCKER_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, ['status', 'reason']);

    blocker = await sails.helpers.blockers.updateOne.with({
      values,
      card,
      board,
      project,
      record: blocker,
      actorUser: currentUser,
      request: this.req,
    });

    if (!blocker) {
      throw Errors.BLOCKER_NOT_FOUND;
    }

    return {
      item: blocker,
    };
  },
};
