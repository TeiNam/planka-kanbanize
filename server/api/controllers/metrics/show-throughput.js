/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
  INVALID_DATE_RANGE: {
    invalidDateRange: 'Date range must be between 1 and 365 days',
  },
};

module.exports = {
  inputs: {
    boardId: {
      ...idInput,
      required: true,
    },
    startDate: {
      type: 'string',
      regex: /^\d{4}-\d{2}-\d{2}$/,
    },
    endDate: {
      type: 'string',
      regex: /^\d{4}-\d{2}-\d{2}$/,
    },
    classOfServiceId: idInput,
  },

  exits: {
    boardNotFound: {
      responseType: 'notFound',
    },
    invalidDateRange: {
      responseType: 'badRequest',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // 보드 존재 확인
    const { board, project } = await sails.helpers.boards
      .getPathToProjectById(inputs.boardId)
      .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND);

    // 보드 멤버십 검증 (뷰어 포함 모든 멤버 접근 가능)
    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      if (currentUser.role !== User.Roles.ADMIN || project.ownerProjectManagerId) {
        const isProjectManager = await sails.helpers.users.isProjectManager(
          currentUser.id,
          project.id,
        );

        if (!isProjectManager) {
          throw Errors.BOARD_NOT_FOUND;
        }
      }
    }

    // 날짜 범위 기본값 설정 (기본 30일)
    const endDate = inputs.endDate || new Date().toISOString().split('T')[0];
    const startDate =
      inputs.startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 날짜 범위 검증 (1~365일)
    const daysDiff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

    if (daysDiff < 1 || daysDiff > 365) {
      throw Errors.INVALID_DATE_RANGE;
    }

    const result = await sails.helpers.metrics.calculateThroughput.with({
      boardId: board.id,
      startDate,
      endDate,
      classOfServiceId: inputs.classOfServiceId || null,
    });

    return {
      item: result,
    };
  },
};
