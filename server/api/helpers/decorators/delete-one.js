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

  async fn(inputs) {
    // 데코레이터 삭제 시 관련 card_decorator 레코드도 cascade 삭제
    await CardDecorator.qm.delete({
      decoratorId: inputs.record.id,
    });

    const decorator = await Decorator.qm.deleteOne(inputs.record.id);

    if (decorator) {
      sails.sockets.broadcast(
        `board:${decorator.boardId}`,
        'decoratorDelete',
        {
          item: decorator,
        },
        inputs.request,
      );
    }

    return decorator;
  },
};
