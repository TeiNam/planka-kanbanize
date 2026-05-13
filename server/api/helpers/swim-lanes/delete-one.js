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

  exits: {
    swimLaneHasCards: {},
  },

  async fn(inputs) {
    // 카드 존재 여부 검증 — 카드가 있으면 삭제 차단
    const cardCount = await Card.count({ swimLaneId: inputs.record.id });

    if (cardCount > 0) {
      throw 'swimLaneHasCards';
    }

    const swimLane = await SwimLane.qm.deleteOne(inputs.record.id);

    if (swimLane) {
      sails.sockets.broadcast(
        `board:${swimLane.boardId}`,
        'swimLaneDelete',
        {
          item: swimLane,
        },
        inputs.request,
      );
    }

    return swimLane;
  },
};
