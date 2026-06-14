/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    pathNotFound: {},
  },

  async fn(inputs) {
    const calendarEvent = await CalendarEvent.qm.getOneById(inputs.id);

    if (!calendarEvent) {
      throw 'pathNotFound';
    }

    // 캘린더 일정은 프로젝트 소속이므로 보드 경유 없이 프로젝트를 직접 조회한다.
    const project = await Project.qm.getOneById(calendarEvent.projectId);

    if (!project) {
      throw {
        pathNotFound: {
          calendarEvent,
        },
      };
    }

    return {
      calendarEvent,
      project,
    };
  },
};
