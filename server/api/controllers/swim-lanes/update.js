/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  SWIM_LANE_NOT_FOUND: {
    swimLaneNotFound: 'Swim lane not found',
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
    name: {
      type: 'string',
      isNotEmptyString: true,
      minLength: 1,
      maxLength: 50,
    },
    category: {
      type: 'string',
      isIn: Object.values(SwimLane.Categories),
      allowNull: true,
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
    swimLaneNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.swimLanes
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.SWIM_LANE_NOT_FOUND);

    let { swimLane } = pathToProject;
    const { board, project } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.SWIM_LANE_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, ['position', 'name', 'category', 'wipLimit', 'color']);

    swimLane = await sails.helpers.swimLanes.updateOne.with({
      values,
      project,
      board,
      record: swimLane,
      actorUser: currentUser,
      request: this.req,
    });

    if (!swimLane) {
      throw Errors.SWIM_LANE_NOT_FOUND;
    }

    return {
      item: swimLane,
    };
  },
};
