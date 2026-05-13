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
    board: {
      type: 'ref',
      required: true,
    },
    project: {
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
    const blockerLinkedCard = await BlockerLinkedCard.qm.deleteOne(inputs.record.id);

    if (blockerLinkedCard) {
      sails.sockets.broadcast(
        `board:${inputs.board.id}`,
        'blockerLinkedCardDelete',
        {
          item: blockerLinkedCard,
        },
        inputs.request,
      );
    }

    return blockerLinkedCard;
  },
};
