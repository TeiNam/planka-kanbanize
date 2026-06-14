/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    record: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    // 삭제 실패(DB 오류/동시 수정)는 에러를 전파하고 이벤트는 변경하지 않음(R5.2)
    const calendarEvent = await CalendarEvent.qm.deleteOne(inputs.record.id);

    if (calendarEvent) {
      // 프로젝트 범위 브로드캐스트 — 컨트롤러가 전달한 project 를 우선 사용,
      // 없으면 record.projectId 로 조회한다.
      const project = inputs.project || (await Project.qm.getOneById(calendarEvent.projectId));

      if (project) {
        const scoper = sails.helpers.projects.makeScoper.with({ record: project });
        const userIds = await scoper.getProjectRelatedUserIds();

        userIds.forEach((userId) => {
          sails.sockets.broadcast(
            `user:${userId}`,
            'calendarEventDelete',
            {
              item: calendarEvent,
            },
            inputs.request,
          );
        });
      }
    }

    return calendarEvent;
  },
};
