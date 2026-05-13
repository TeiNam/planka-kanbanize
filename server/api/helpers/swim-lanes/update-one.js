/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    record: {
      type: 'ref',
      required: true,
    },
    values: {
      type: 'json',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { values } = inputs;

    if (!_.isUndefined(values.position)) {
      const swimLanes = await SwimLane.qm.getByBoardId(inputs.record.boardId, {
        exceptIdOrIds: inputs.record.id,
      });

      const { position, repositions } = sails.helpers.utils.insertToPositionables(
        values.position,
        swimLanes,
      );

      values.position = position;

      // eslint-disable-next-line no-restricted-syntax
      for (const reposition of repositions) {
        // eslint-disable-next-line no-await-in-loop
        await SwimLane.qm.updateOne(
          {
            id: reposition.record.id,
            boardId: reposition.record.boardId,
          },
          {
            position: reposition.position,
          },
        );

        sails.sockets.broadcast(`board:${inputs.record.boardId}`, 'swimLaneUpdate', {
          item: {
            id: reposition.record.id,
            position: reposition.position,
          },
        });
      }
    }

    const swimLane = await SwimLane.qm.updateOne(inputs.record.id, values);

    if (swimLane) {
      sails.sockets.broadcast(
        `board:${swimLane.boardId}`,
        'swimLaneUpdate',
        {
          item: swimLane,
        },
        inputs.request,
      );
    }

    return swimLane;
  },
};
