/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  CALENDAR_EVENT_NOT_FOUND: {
    calendarEventNotFound: 'Calendar event not found',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    calendarEventNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // 1) 경로/리소스 조회 — 없으면 notFound (R4.5/5.3)
    const { calendarEvent, project } = await sails.helpers.calendarEvents
      .getPathToProjectById(inputs.id)
      .intercept('pathNotFound', () => Errors.CALENDAR_EVENT_NOT_FOUND);

    // 2) 접근 제어 — 프로젝트 관리자이거나 프로젝트 내 보드 멤버십 보유. 비멤버는 notFound.
    const isProjectManager = await sails.helpers.users.isProjectManager(currentUser.id, project.id);

    if (!isProjectManager) {
      const boardMemberships = await BoardMembership.qm.getByProjectIdAndUserId(
        project.id,
        currentUser.id,
      );

      if (boardMemberships.length === 0) {
        throw Errors.CALENDAR_EVENT_NOT_FOUND;
      }
    }

    // 3) 헬퍼 호출 — 삭제 실패 시 에러 전파(미변경, R5.2)
    const deletedCalendarEvent = await sails.helpers.calendarEvents.deleteOne.with({
      record: calendarEvent,
      project,
      request: this.req,
    });

    if (!deletedCalendarEvent) {
      throw Errors.CALENDAR_EVENT_NOT_FOUND;
    }

    return {
      item: deletedCalendarEvent,
    };
  },
};
