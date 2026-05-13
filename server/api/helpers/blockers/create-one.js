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
    card: {
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
    const { values } = inputs;

    const blocker = await Blocker.qm.createOne({
      reason: values.reason,
      status: Blocker.Statuses.ACTIVE,
      cardId: inputs.card.id,
      creatorUserId: inputs.actorUser.id,
    });

    sails.sockets.broadcast(
      `board:${inputs.board.id}`,
      'blockerCreate',
      {
        item: blocker,
      },
      inputs.request,
    );

    return blocker;
  },
};
