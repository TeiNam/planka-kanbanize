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

    // status가 resolved로 변경되면 resolvedAt 설정
    if (
      values.status === Blocker.Statuses.RESOLVED &&
      inputs.record.status !== Blocker.Statuses.RESOLVED
    ) {
      values.resolvedAt = new Date().toISOString();
    }

    // status가 active로 되돌아가면 resolvedAt 초기화
    if (
      values.status === Blocker.Statuses.ACTIVE &&
      inputs.record.status === Blocker.Statuses.RESOLVED
    ) {
      values.resolvedAt = null;
    }

    const blocker = await Blocker.qm.updateOne(inputs.record.id, values);

    if (blocker) {
      sails.sockets.broadcast(
        `board:${inputs.board.id}`,
        'blockerUpdate',
        {
          item: blocker,
        },
        inputs.request,
      );
    }

    return blocker;
  },
};
