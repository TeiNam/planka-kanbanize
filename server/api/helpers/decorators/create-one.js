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

    const decorator = await Decorator.qm.createOne({
      ...values,
      boardId: values.board.id,
    });

    sails.sockets.broadcast(
      `board:${decorator.boardId}`,
      'decoratorCreate',
      {
        item: decorator,
      },
      inputs.request,
    );

    return decorator;
  },
};
