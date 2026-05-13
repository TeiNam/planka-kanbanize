/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * SwimLane.js
 *
 * @description :: 칸반 보드의 스윔레인(수평 분류) 모델
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const Types = {
  STANDARD: 'standard',
  EXPEDITE: 'expedite',
};

const Categories = {
  WORK_ITEM_TYPE: 'work_item_type',
  CLASS_OF_SERVICE: 'class_of_service',
  REQUESTOR: 'requestor',
  PROJECT: 'project',
};

module.exports = {
  Types,
  Categories,

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    position: {
      type: 'number',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    category: {
      type: 'string',
      isIn: Object.values(Categories),
      allowNull: true,
    },
    type: {
      type: 'string',
      isIn: Object.values(Types),
      defaultsTo: Types.STANDARD,
    },
    wipLimit: {
      type: 'number',
      allowNull: true,
      columnName: 'wip_limit',
    },
    color: {
      type: 'string',
      allowNull: true,
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    boardId: {
      model: 'Board',
      required: true,
      columnName: 'board_id',
    },
    cards: {
      collection: 'Card',
      via: 'swimLaneId',
    },
  },

  tableName: 'swim_lane',
};
