/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /boards/{id}:
 *   patch:
 *     summary: Update board
 *     description: Updates a board. Project managers can update all fields, board members can only subscribe/unsubscribe.
 *     tags:
 *       - Boards
 *     operationId: updateBoard
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the board to update
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
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: Position of the board within the project
 *                 example: 65536
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 description: Name/title of the board
 *                 example: Development Board
 *               defaultView:
 *                 type: string
 *                 enum: [kanban, grid, list]
 *                 description: Default view for the board
 *                 example: kanban
 *               defaultCardType:
 *                 type: string
 *                 enum: [project, story]
 *                 description: Default card type for new cards
 *                 example: project
 *               limitCardTypesToDefaultOne:
 *                 type: boolean
 *                 description: Whether to limit card types to default one
 *                 example: false
 *               alwaysDisplayCardCreator:
 *                 type: boolean
 *                 description: Whether to always display card creators
 *                 example: false
 *               displayCardAges:
 *                 type: boolean
 *                 description: Whether to display card ages
 *                 example: false
 *               expandTaskListsByDefault:
 *                 type: boolean
 *                 description: Whether to expand task lists by default
 *                 example: false
 *               systemWipLimit:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 maximum: 100
 *                 description: System-level WIP limit for the entire board (null = no limit)
 *                 example: 24
 *               isSubscribed:
 *                 type: boolean
 *                 description: Whether the current user is subscribed to the board
 *                 example: true
 *     responses:
 *       200:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/Board'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  WIP_LIMIT_SUM_EXCEEDS_SYSTEM_LIMIT: {
    wipLimitSumExceedsSystemLimit: 'Existing column WIP limits sum exceeds new Total WIP limit',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
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
    defaultView: {
      type: 'string',
      isIn: Object.values(Board.Views),
    },
    defaultCardType: {
      type: 'string',
      isIn: Object.values(Card.Types),
    },
    limitCardTypesToDefaultOne: {
      type: 'boolean',
    },
    alwaysDisplayCardCreator: {
      type: 'boolean',
    },
    displayCardAges: {
      type: 'boolean',
    },
    expandTaskListsByDefault: {
      type: 'boolean',
    },
    systemWipLimit: {
      type: 'number',
      allowNull: true,
      min: 1,
      max: 1000,
    },
    wipLimitMode: {
      type: 'string',
      isIn: Object.values(Board.WipLimitModes),
    },
    isSwimLanesEnabled: {
      type: 'boolean',
    },
    isExpediteLaneEnabled: {
      type: 'boolean',
    },
    expediteWipLimit: {
      type: 'number',
      min: 1,
      max: 2,
    },
    isSubscribed: {
      type: 'boolean',
    },
  },

  exits: {
    boardNotFound: {
      responseType: 'notFound',
    },
    notEnoughRights: {
      responseType: 'forbidden',
    },
    wipLimitSumExceedsSystemLimit: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const pathToProject = await sails.helpers.boards
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND);

    let { board } = pathToProject;
    const { project } = pathToProject;

    const isProjectManager = await sails.helpers.users.isProjectManager(currentUser.id, project.id);
    const isBoardMember = await sails.helpers.users.isBoardMember(currentUser.id, board.id);

    if (!isProjectManager && !isBoardMember) {
      throw Errors.BOARD_NOT_FOUND; // Forbidden
    }

    const availableInputKeys = ['id'];
    if (isProjectManager) {
      availableInputKeys.push(
        'position',
        'name',
        'defaultView',
        'defaultCardType',
        'limitCardTypesToDefaultOne',
        'alwaysDisplayCardCreator',
        'displayCardAges',
        'expandTaskListsByDefault',
        'systemWipLimit',
        'wipLimitMode',
        'isSwimLanesEnabled',
        'isExpediteLaneEnabled',
        'expediteWipLimit',
      );
    }
    if (isBoardMember) {
      availableInputKeys.push('isSubscribed');
    }

    if (_.difference(Object.keys(inputs), availableInputKeys).length > 0) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, [
      'position',
      'name',
      'defaultView',
      'defaultCardType',
      'limitCardTypesToDefaultOne',
      'alwaysDisplayCardCreator',
      'displayCardAges',
      'expandTaskListsByDefault',
      'systemWipLimit',
      'wipLimitMode',
      'isSwimLanesEnabled',
      'isExpediteLaneEnabled',
      'expediteWipLimit',
      'isSubscribed',
    ]);

    board = await sails.helpers.boards.updateOne
      .with({
        values,
        project,
        record: board,
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('wipLimitSumExceedsSystemLimit', () => Errors.WIP_LIMIT_SUM_EXCEEDS_SYSTEM_LIMIT);

    if (!board) {
      throw Errors.BOARD_NOT_FOUND;
    }

    return {
      item: board,
    };
  },
};
