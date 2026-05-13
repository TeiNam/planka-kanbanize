/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * ClassOfService.js
 *
 * @description :: 칸반 서비스 클래스 모델 (Expedite, Fixed Date, Standard, Intangible, Custom)
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const Types = {
  EXPEDITE: 'expedite',
  FIXED_DATE: 'fixed_date',
  STANDARD: 'standard',
  INTANGIBLE: 'intangible',
  CUSTOM: 'custom',
};

const COLORS = [
  'muddy-grey',
  'autumn-leafs',
  'morning-sky',
  'antique-blue',
  'egg-yellow',
  'desert-sand',
  'dark-granite',
  'fresh-salad',
  'lagoon-blue',
  'midnight-blue',
  'light-orange',
  'pumpkin-orange',
  'light-concrete',
  'sunny-grass',
  'navy-blue',
  'lilac-eyes',
  'apricot-red',
  'orange-peel',
  'silver-glint',
  'bright-moss',
  'deep-ocean',
  'summer-sky',
  'berry-red',
  'light-cocoa',
  'grey-stone',
  'tank-green',
  'coral-green',
  'sugar-plum',
  'pink-tulip',
  'shady-rust',
  'wet-rock',
  'wet-moss',
  'turquoise-sea',
  'lavender-fields',
  'piggy-red',
  'light-mud',
  'gun-metal',
  'modern-green',
  'french-coast',
  'sweet-lilac',
  'red-burgundy',
  'pirate-gold',
];

module.exports = {
  Types,
  COLORS,

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true,
    },
    type: {
      type: 'string',
      isIn: Object.values(Types),
      defaultsTo: Types.CUSTOM,
    },
    color: {
      type: 'string',
      required: true,
    },
    policy: {
      type: 'string',
      allowNull: true,
    },
    position: {
      type: 'number',
      required: true,
    },
    isDefault: {
      type: 'boolean',
      defaultsTo: false,
      columnName: 'is_default',
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
      via: 'classOfServiceId',
    },
  },

  tableName: 'class_of_service',
};
