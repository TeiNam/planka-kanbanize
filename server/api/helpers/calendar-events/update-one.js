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
    values: {
      type: 'json',
      required: true,
    },
    project: {
      type: 'ref',
    },
    request: {
      type: 'ref',
    },
  },

  exits: {
    endBeforeStart: {},
  },

  async fn(inputs) {
    const { record, values } = inputs;

    // 부분 수정 시 기존 값과 병합하여 시간 불변식 검증(R4.1/4.3)
    const startAt = _.isUndefined(values.startAt) ? record.startAt : values.startAt;
    const endAt = _.isUndefined(values.endAt) ? record.endAt : values.endAt;

    // 검증 통과 후에만 영속 — end_at >= start_at
    if (
      !_.isNil(startAt) &&
      !_.isNil(endAt) &&
      new Date(endAt).getTime() < new Date(startAt).getTime()
    ) {
      throw 'endBeforeStart';
    }

    const calendarEvent = await CalendarEvent.qm.updateOne(record.id, values);

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
            'calendarEventUpdate',
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
