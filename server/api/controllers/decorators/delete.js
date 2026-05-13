/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  DECORATOR_NOT_FOUND: {
    decoratorNotFound: 'Decorator not found',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    decoratorNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.decorators
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.DECORATOR_NOT_FOUND);

    let { decorator } = pathToProject;
    const { board, project } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.DECORATOR_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    decorator = await sails.helpers.decorators.deleteOne.with({
      project,
      board,
      record: decorator,
      actorUser: currentUser,
      request: this.req,
    });

    if (!decorator) {
      throw Errors.DECORATOR_NOT_FOUND;
    }

    return {
      item: decorator,
    };
  },
};
