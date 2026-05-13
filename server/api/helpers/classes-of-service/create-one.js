/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const MAX_CUSTOM_CLASSES = 10;

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

  exits: {
    maxCustomClassesReached: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    // 사용자 정의 서비스 클래스 최대 10개 제한 검증
    if (!values.isDefault) {
      const customCount = await ClassOfService.qm.getCustomCountByBoardId(inputs.board.id);

      if (customCount >= MAX_CUSTOM_CLASSES) {
        throw 'maxCustomClassesReached';
      }
    }

    const classesOfService = await ClassOfService.qm.getByBoardId(inputs.board.id);

    const { position, repositions } = sails.helpers.utils.insertToPositionables(
      values.position,
      classesOfService,
    );

    values.position = position;

    // eslint-disable-next-line no-restricted-syntax
    for (const reposition of repositions) {
      // eslint-disable-next-line no-await-in-loop
      await ClassOfService.qm.updateOne(
        {
          id: reposition.record.id,
          boardId: reposition.record.boardId,
        },
        {
          position: reposition.position,
        },
      );

      sails.sockets.broadcast(`board:${inputs.board.id}`, 'classOfServiceUpdate', {
        item: {
          id: reposition.record.id,
          position: reposition.position,
        },
      });
    }

    const classOfService = await ClassOfService.qm.createOne({
      ...values,
      boardId: inputs.board.id,
    });

    sails.sockets.broadcast(
      `board:${classOfService.boardId}`,
      'classOfServiceCreate',
      {
        item: classOfService,
      },
      inputs.request,
    );

    return classOfService;
  },
};
