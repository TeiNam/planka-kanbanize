/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * CardMovementLog.js
 *
 * @description :: 카드 컬럼 이동 이력 모델 (Lead Time 계산용)
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    movedAt: {
      type: 'ref',
      required: true,
      columnName: 'moved_at',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    cardId: {
      model: 'Card',
      required: true,
      columnName: 'card_id',
    },
    boardId: {
      model: 'Board',
      required: true,
      columnName: 'board_id',
    },
    fromListId: {
      model: 'List',
      columnName: 'from_list_id',
    },
    toListId: {
      model: 'List',
      columnName: 'to_list_id',
    },
    fromSwimLaneId: {
      model: 'SwimLane',
      columnName: 'from_swim_lane_id',
    },
    toSwimLaneId: {
      model: 'SwimLane',
      columnName: 'to_swim_lane_id',
    },
    userId: {
      model: 'User',
      columnName: 'user_id',
    },
  },

  tableName: 'card_movement_log',
};
