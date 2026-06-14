/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');
const { isDueDate } = require('../../../utils/validators');

const Errors = {
  PROJECT_NOT_FOUND: {
    projectNotFound: 'Project not found',
  },
  END_BEFORE_START: {
    endBeforeStart: 'End must not be before start',
  },
};

module.exports = {
  inputs: {
    projectId: {
      ...idInput,
      required: true,
    },
    name: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 1024,
      required: true,
    },
    eventKind: {
      type: 'string',
      isIn: Object.values(CalendarEvent.Kinds),
      required: true,
    },
    startAt: {
      type: 'string',
      custom: isDueDate,
      required: true,
    },
    endAt: {
      type: 'string',
      custom: isDueDate,
      required: true,
    },
    color: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },
  },

  exits: {
    projectNotFound: {
      responseType: 'notFound',
    },
    endBeforeStart: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // 1) 프로젝트 조회 — 없으면 notFound
    const project = await Project.qm.getOneById(inputs.projectId);

    if (!project) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    // 2) 접근 제어 — 프로젝트 관리자이거나 프로젝트 내 보드 멤버십이 하나라도 있어야 함.
    //    비멤버는 프로젝트 존재를 숨기기 위해 notFound 로 매핑한다.
    const isProjectManager = await sails.helpers.users.isProjectManager(currentUser.id, project.id);

    if (!isProjectManager) {
      const boardMemberships = await BoardMembership.qm.getByProjectIdAndUserId(
        project.id,
        currentUser.id,
      );

      if (boardMemberships.length === 0) {
        throw Errors.PROJECT_NOT_FOUND;
      }
    }

    const values = _.pick(inputs, ['name', 'eventKind', 'startAt', 'endAt', 'color']);

    // 3) 헬퍼 호출 — 시간 불변식 위반 시 unprocessableEntity (R3.6/3.7)
    const calendarEvent = await sails.helpers.calendarEvents.createOne
      .with({
        values: {
          ...values,
          project,
          creatorUser: currentUser,
        },
        request: this.req,
      })
      .intercept('endBeforeStart', () => Errors.END_BEFORE_START);

    return {
      item: calendarEvent,
    };
  },
};
