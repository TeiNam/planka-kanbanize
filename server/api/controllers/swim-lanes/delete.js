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
  SWIM_LANE_HAS_CARDS: {
    swimLaneHasCards: 'Swim lane has cards and cannot be deleted',
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
    swimLaneNotFound: {
      responseType: 'notFound',
    },
    swimLaneHasCards: {
      responseType: 'conflict',
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

    swimLane = await sails.helpers.swimLanes.deleteOne
      .with({
        project,
        board,
        record: swimLane,
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('swimLaneHasCards', () => Errors.SWIM_LANE_HAS_CARDS);

    if (!swimLane) {
      throw Errors.SWIM_LANE_NOT_FOUND;
    }

    return {
      item: swimLane,
    };
  },
};
