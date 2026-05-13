/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /lists/{id}:
 *   patch:
 *     summary: Update list
 *     description: Updates a list. Can move lists between boards. Requires board editor permissions.
 *     tags:
 *       - Lists
 *     operationId: updateList
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the list to update
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boardId:
 *                 type: string
 *                 description: ID of the board to move list to
 *                 example: "1357158568008091265"
 *               type:
 *                 type: string
 *                 enum: [backlog, task, closed, discard]
 *                 description: Type/status of the list
 *                 example: task
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: Position of the list within the board
 *                 example: 65536
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 description: Name/title of the list
 *                 example: To Do
 *               color:
 *                 type: string
 *                 enum: [berry-red, pumpkin-orange, lagoon-blue, pink-tulip, light-mud, orange-peel, bright-moss, antique-blue, dark-granite, turquoise-sea]
 *                 nullable: true
 *                 description: Color for the list
 *                 example: lagoon-blue
 *     responses:
 *       200:
 *         description: List updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/List'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  LIST_NOT_FOUND: {
    listNotFound: 'List not found',
  },
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
  BACKLOG_ALREADY_EXISTS: {
    backlogAlreadyExists: 'Backlog list already exists in this board',
  },
  BACKLOG_MUST_BE_LEFTMOST: {
    backlogMustBeLeftmost: 'Backlog must be the leftmost list',
  },
  WIP_LIMIT_SUM_EXCEEDS_SYSTEM_LIMIT: {
    wipLimitSumExceedsSystemLimit: 'Sum of column WIP limits exceeds Total WIP limit',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
    boardId: idInput,
    type: {
      type: 'string',
      isIn: List.KANBAN_TYPES,
    },
    position: {
      type: 'number',
      min: 0,
    },
    name: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 128,
    },
    color: {
      type: 'string',
      isIn: List.COLORS,
      allowNull: true,
    },
    wipLimit: {
      type: 'number',
      min: 1,
      max: 100,
      allowNull: true,
    },
    subColumnType: {
      type: 'string',
      isIn: ['active', 'done'],
      allowNull: true,
    },
    isBuffer: {
      type: 'boolean',
    },
    pullCriteria: {
      type: 'string',
      maxLength: 500,
      allowNull: true,
    },
    policy: {
      type: 'string',
      maxLength: 500,
      allowNull: true,
    },
    enableSubColumns: {
      type: 'boolean',
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    listNotFound: {
      responseType: 'notFound',
    },
    boardNotFound: {
      responseType: 'notFound',
    },
    backlogAlreadyExists: {
      responseType: 'unprocessableEntity',
    },
    backlogMustBeLeftmost: {
      responseType: 'unprocessableEntity',
    },
    wipLimitSumExceedsSystemLimit: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.lists
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.LIST_NOT_FOUND);

    let { list } = pathToProject;
    const { board, project } = pathToProject;

    let boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.LIST_NOT_FOUND; // Forbidden
    }

    if (!sails.helpers.lists.isKanban(list)) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    let nextProject;
    let nextBoard;

    if (!_.isUndefined(inputs.boardId)) {
      ({ board: nextBoard, project: nextProject } = await sails.helpers.boards
        .getPathToProjectById(inputs.boardId)
        .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND));

      boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
        nextBoard.id,
        currentUser.id,
      );

      if (!boardMembership) {
        throw Errors.BOARD_NOT_FOUND; // Forbidden
      }

      if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
        throw Errors.NOT_ENOUGH_RIGHTS;
      }
    }

    const values = _.pick(inputs, [
      'type',
      'position',
      'name',
      'color',
      'wipLimit',
      'subColumnType',
      'isBuffer',
      'pullCriteria',
      'policy',
    ]);

    list = await sails.helpers.lists.updateOne
      .with({
        project,
        board,
        record: list,
        values: {
          ...values,
          project: nextProject,
          board: nextBoard,
        },
        enableSubColumns: inputs.enableSubColumns,
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('backlogAlreadyExists', () => Errors.BACKLOG_ALREADY_EXISTS)
      .intercept('backlogMustBeLeftmost', () => Errors.BACKLOG_MUST_BE_LEFTMOST)
      .intercept(
        'wipLimitSumExceedsSystemLimit',
        () => Errors.WIP_LIMIT_SUM_EXCEEDS_SYSTEM_LIMIT,
      );

    if (!list) {
      throw Errors.LIST_NOT_FOUND;
    }

    return {
      item: list,
    };
  },
};
