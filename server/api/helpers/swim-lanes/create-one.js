/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    values: {
      type: 'ref',
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

    // Expedite 타입인 경우 WIP 제한 기본값 1, position 최상단 고정
    if (values.type === SwimLane.Types.EXPEDITE) {
      if (_.isUndefined(values.wipLimit) || values.wipLimit === null) {
        values.wipLimit = 1;
      }
      values.position = 0;
    }

    const swimLanes = await SwimLane.qm.getByBoardId(inputs.board.id);

    const { position, repositions } = sails.helpers.utils.insertToPositionables(
      values.position,
      swimLanes,
    );

    values.position = position;

    if (repositions.length > 0) {
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

        sails.sockets.broadcast(`board:${inputs.board.id}`, 'swimLaneUpdate', {
          item: {
            id: reposition.record.id,
            position: reposition.position,
          },
        });
      }
    }

    const swimLane = await SwimLane.qm.createOne({
      ...values,
      boardId: inputs.board.id,
    });

    sails.sockets.broadcast(
      `board:${swimLane.boardId}`,
      'swimLaneCreate',
      {
        item: swimLane,
      },
      inputs.request,
    );

    return swimLane;
  },
};
