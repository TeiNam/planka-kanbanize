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
    list: {
      type: 'ref',
      required: true,
    },
    card: {
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
    const cardDecorator = await CardDecorator.qm.deleteOne(inputs.record.id);

    if (cardDecorator) {
      sails.sockets.broadcast(
        `board:${inputs.board.id}`,
        'cardDecoratorDelete',
        {
          item: cardDecorator,
        },
        inputs.request,
      );
    }

    return cardDecorator;
  },
};
