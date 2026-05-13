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
    cannotDeleteDefault: {},
  },

  async fn(inputs) {
    // 기본 서비스 클래스는 삭제 불가
    if (inputs.record.isDefault) {
      throw 'cannotDeleteDefault';
    }

    // 이 서비스 클래스를 사용하는 모든 카드의 classOfServiceId를 null로 설정
    const { cards } = await Card.qm.update(
      { classOfServiceId: inputs.record.id },
      { classOfServiceId: null },
    );

    if (cards && cards.length > 0) {
      cards.forEach((card) => {
        sails.sockets.broadcast(`board:${inputs.board.id}`, 'cardUpdate', {
          item: card,
        });
      });
    }

    const classOfService = await ClassOfService.qm.deleteOne(inputs.record.id);

    if (classOfService) {
      sails.sockets.broadcast(
        `board:${classOfService.boardId}`,
        'classOfServiceDelete',
        {
          item: classOfService,
        },
        inputs.request,
      );
    }

    return classOfService;
  },
};
