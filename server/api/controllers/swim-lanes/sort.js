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
    swimLaneIds: {
      type: 'json',
      required: true,
      custom: (value) => _.isArray(value) && value.length > 0 && value.every(_.isString),
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

    const { board } = await sails.helpers.boards
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

    const swimLanes = await SwimLane.qm.getByBoardId(board.id);
    const swimLaneById = _.keyBy(swimLanes, 'id');

    const updatedSwimLanes = await Promise.all(
      inputs.swimLaneIds.map(async (swimLaneId, index) => {
        const swimLane = swimLaneById[swimLaneId];

        if (!swimLane) {
          return null;
        }

        const position = (index + 1) * 65536;

        if (swimLane.position === position) {
          return swimLane;
        }

        const updated = await SwimLane.qm.updateOne(
          { id: swimLane.id, boardId: board.id },
          { position },
        );

        if (updated) {
          sails.sockets.broadcast(
            `board:${board.id}`,
            'swimLaneUpdate',
            { item: { id: updated.id, position: updated.position } },
            this.req,
          );
        }

        return updated;
      }),
    );

    return {
      items: updatedSwimLanes.filter(Boolean),
    };
  },
};
