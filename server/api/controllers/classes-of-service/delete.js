/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  CLASS_OF_SERVICE_NOT_FOUND: {
    classOfServiceNotFound: 'Class of service not found',
  },
  CANNOT_DELETE_DEFAULT: {
    cannotDeleteDefault: 'Cannot delete default class of service',
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
    classOfServiceNotFound: {
      responseType: 'notFound',
    },
    cannotDeleteDefault: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.classesOfService
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.CLASS_OF_SERVICE_NOT_FOUND);

    let { classOfService } = pathToProject;
    const { board, project } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.CLASS_OF_SERVICE_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    classOfService = await sails.helpers.classesOfService.deleteOne
      .with({
        project,
        board,
        record: classOfService,
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('cannotDeleteDefault', () => Errors.CANNOT_DELETE_DEFAULT);

    if (!classOfService) {
      throw Errors.CLASS_OF_SERVICE_NOT_FOUND;
    }

    return {
      item: classOfService,
    };
  },
};
