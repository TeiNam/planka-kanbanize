/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * CalendarEvent.js
 *
 * @description :: 프로젝트 단위로 공유되는 캘린더 일정 모델
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const Kinds = {
  ALL_DAY: 'all_day',
  TIME_BASED: 'time_based',
};

module.exports = {
  Kinds,

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true,
    },
    eventKind: {
      type: 'string',
      isIn: Object.values(Kinds),
      defaultsTo: Kinds.ALL_DAY,
      columnName: 'event_kind',
    },
    startAt: {
      type: 'ref',
      required: true,
      columnName: 'start_at',
    },
    endAt: {
      type: 'ref',
      required: true,
      columnName: 'end_at',
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

    projectId: {
      model: 'Project',
      required: true,
      columnName: 'project_id',
    },
    creatorUserId: {
      model: 'User',
      columnName: 'creator_user_id',
    },
  },

  tableName: 'calendar_event',
};
