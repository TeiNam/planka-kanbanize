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
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
    position: {
      type: 'number',
      min: 0,
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
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    commitmentPointNotFound: {
      responseType: 'notFound',
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

    const values = _.pick(inputs, ['position', 'label', 'type']);

    commitmentPoint = await sails.helpers.commitmentPoints.updateOne.with({
      values,
      project,
      board,
      record: commitmentPoint,
      actorUser: currentUser,
      request: this.req,
    });

    if (!commitmentPoint) {
      throw Errors.COMMITMENT_POINT_NOT_FOUND;
    }

    return {
      item: commitmentPoint,
    };
  },
};
