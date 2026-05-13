/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * List.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     List:
 *       type: object
 *       required:
 *         - id
 *         - boardId
 *         - type
 *         - position
 *         - name
 *         - color
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the list
 *           example: "1357158568008091264"
 *         boardId:
 *           type: string
 *           description: ID of the board the list belongs to
 *           example: "1357158568008091265"
 *         type:
 *           type: string
 *           enum: [backlog, task, closed, discard, archive, trash]
 *           description: Type/status of the list
 *           example: task
 *         position:
 *           type: number
 *           nullable: true
 *           description: Position of the list within the board
 *           example: 65536
 *         name:
 *           type: string
 *           nullable: true
 *           description: Name/title of the list
 *           example: To Do
 *         color:
 *           type: string
 *           enum: [berry-red, pumpkin-orange, lagoon-blue, pink-tulip, light-mud, orange-peel, bright-moss, antique-blue, dark-granite, turquoise-sea]
 *           nullable: true
 *           description: Color for the list
 *           example: lagoon-blue
 *         createdAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the list was created
 *           example: 2024-01-01T00:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the list was last updated
 *           example: 2024-01-01T00:00:00.000Z
 */

const Types = {
  BACKLOG: 'backlog',
  TASK: 'task',
  CLOSED: 'closed',
  DISCARD: 'discard',
  ARCHIVE: 'archive',
  TRASH: 'trash',
};

const TypeStates = {
  OPENED: 'opened',
  CLOSED: 'closed',
};

const SortFieldNames = {
  NAME: 'name',
  DUE_DATE: 'dueDate',
  CREATED_AT: 'createdAt',
};

// TODO: should not be here
const SortOrders = {
  ASC: 'asc',
  DESC: 'desc',
};

// 보드 본문에 표시되는 일반 칸반 컬럼들 (백로그, 태스크, 완료, 디스카드)
const KANBAN_TYPES = [Types.BACKLOG, Types.TASK, Types.CLOSED, Types.DISCARD];

// "유한" 보드 뷰(FiniteContent)에 노출되는 타입들 — KANBAN_TYPES와 동일하게 유지
const FINITE_TYPES = KANBAN_TYPES;

// WIP 카운트 대상: 태스크 컬럼만 — 백로그/완료/디스카드/아카이브/휴지통은 제외
const WIP_COUNT_TYPES = [Types.TASK];

const TYPE_STATE_BY_TYPE = {
  [Types.BACKLOG]: TypeStates.OPENED,
  [Types.TASK]: TypeStates.OPENED,
  [Types.CLOSED]: TypeStates.CLOSED,
  [Types.DISCARD]: TypeStates.CLOSED,
};

const COLORS = [
  'berry-red',
  'pumpkin-orange',
  'lagoon-blue',
  'pink-tulip',
  'light-mud',
  'orange-peel',
  'bright-moss',
  'antique-blue',
  'dark-granite',
  'turquoise-sea',
];

module.exports = {
  Types,
  TypeStates,
  SortFieldNames,
  SortOrders,
  FINITE_TYPES,
  KANBAN_TYPES,
  WIP_COUNT_TYPES,
  TYPE_STATE_BY_TYPE,
  COLORS,

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    type: {
      type: 'string',
      isIn: Object.values(Types),
      required: true,
    },
    position: {
      type: 'number',
      allowNull: true,
    },
    name: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },
    color: {
      type: 'string',
      isIn: COLORS,
      allowNull: true,
    },
    wipLimit: {
      type: 'number',
      allowNull: true,
      columnName: 'wip_limit',
    },
    subColumnType: {
      type: 'string',
      isIn: ['active', 'done'],
      allowNull: true,
      columnName: 'sub_column_type',
    },
    isBuffer: {
      type: 'boolean',
      defaultsTo: false,
      columnName: 'is_buffer',
    },
    pullCriteria: {
      type: 'string',
      allowNull: true,
      columnName: 'pull_criteria',
    },
    policy: {
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
    parentListId: {
      model: 'List',
      columnName: 'parent_list_id',
    },
    swimLaneId: {
      model: 'SwimLane',
      columnName: 'swim_lane_id',
    },
    cards: {
      collection: 'Card',
      via: 'listId',
    },
    subColumns: {
      collection: 'List',
      via: 'parentListId',
    },
  },
};
