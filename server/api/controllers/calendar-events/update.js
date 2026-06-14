/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');
const { isDueDate } = require('../../../utils/validators');

const Errors = {
  CALENDAR_EVENT_NOT_FOUND: {
    calendarEventNotFound: 'Calendar event not found',
  },
  END_BEFORE_START: {
    endBeforeStart: 'End must not be before start',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
    name: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 1024,
    },
    eventKind: {
      type: 'string',
      isIn: Object.values(CalendarEvent.Kinds),
    },
    startAt: {
      type: 'string',
      custom: isDueDate,
    },
    endAt: {
      type: 'string',
      custom: isDueDate,
    },
    color: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },
  },

  exits: {
    calendarEventNotFound: {
      responseType: 'notFound',
    },
    endBeforeStart: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // 1) 경로/리소스 조회 — 입력 스키마 검증 이후 수행되므로 존재하지 않는 이벤트에 대한
    //    잘못된 수정은 검증 오류가 먼저 반환된다(R4.4). 없으면 notFound (R4.5/5.3)
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

    const values = _.pick(inputs, ['name', 'eventKind', 'startAt', 'endAt', 'color']);

    // 3) 헬퍼 호출 — 시간 불변식 위반 시 unprocessableEntity (R4.3)
    const updatedCalendarEvent = await sails.helpers.calendarEvents.updateOne
      .with({
        record: calendarEvent,
        values,
        project,
        request: this.req,
      })
      .intercept('endBeforeStart', () => Errors.END_BEFORE_START);

    if (!updatedCalendarEvent) {
      throw Errors.CALENDAR_EVENT_NOT_FOUND;
    }

    return {
      item: updatedCalendarEvent,
    };
  },
};
