/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  COMMITMENT_POINT_NOT_FOUND: {
    commitmentPointNotFound: 'Commitment point not found',
  },
  MIN_COMMITMENT_POINTS_REQUIRED: {
    minCommitmentPointsRequired: 'Board must have at least 2 commitment points',
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
    commitmentPointNotFound: {
      responseType: 'notFound',
    },
    minCommitmentPointsRequired: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.commitmentPoints
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.COMMITMENT_POINT_NOT_FOUND);

    let { commitmentPoint } = pathToProject;
    const { board, project } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.COMMITMENT_POINT_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    commitmentPoint = await sails.helpers.commitmentPoints.deleteOne
      .with({
        project,
        board,
        record: commitmentPoint,
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('minCommitmentPointsRequired', () => Errors.MIN_COMMITMENT_POINTS_REQUIRED);

    if (!commitmentPoint) {
      throw Errors.COMMITMENT_POINT_NOT_FOUND;
    }

    return {
      item: commitmentPoint,
    };
  },
};
