/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /boards/{boardId}/lists:
 *   post:
 *     summary: Create list
 *     description: Creates a list within a board. Requires board editor permissions.
 *     tags:
 *       - Lists
 *     operationId: createList
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         description: ID of the board to create the list in
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - position
 *               - name
 *             properties:
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
 *     responses:
 *       200:
 *         description: List created successfully
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
    boardId: {
      ...idInput,
      required: true,
    },
    type: {
      type: 'string',
      isIn: List.KANBAN_TYPES,
      required: true,
    },
    position: {
      type: 'number',
      min: 0,
      required: true,
    },
    name: {
      type: 'string',
      maxLength: 128,
      required: true,
    },
    swimLaneId: {
      ...idInput,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
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

    const { board, project } = await sails.helpers.boards
      .getPathToProjectById(inputs.boardId)
      .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND);

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.BOARD_NOT_FOUND; // Forbidden
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, ['type', 'position', 'name', 'swimLaneId']);

    const list = await sails.helpers.lists.createOne
      .with({
        project,
        values: {
          ...values,
          board,
        },
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('backlogAlreadyExists', () => Errors.BACKLOG_ALREADY_EXISTS)
      .intercept('backlogMustBeLeftmost', () => Errors.BACKLOG_MUST_BE_LEFTMOST)
      .intercept('wipLimitSumExceedsSystemLimit', () => Errors.WIP_LIMIT_SUM_EXCEEDS_SYSTEM_LIMIT);

    return {
      item: list,
    };
  },
};
