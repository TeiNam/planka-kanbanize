/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    values: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  exits: {
    endBeforeStart: {},
  },

  async fn(inputs) {
    const { values } = inputs;
    const { project } = values;

    // 시간 불변식 검증(R3.6/3.7) — end_at >= start_at 인 경우에만 영속
    if (new Date(values.endAt).getTime() < new Date(values.startAt).getTime()) {
      throw 'endBeforeStart';
    }

    const calendarEvent = await CalendarEvent.qm.createOne({
      ..._.omit(values, ['project', 'creatorUser']),
      projectId: project.id,
      creatorUserId: values.creatorUser ? values.creatorUser.id : null,
    });

    // 프로젝트 범위 브로드캐스트 — 프로젝트 관련 사용자 전원의 user 룸으로 전송
    const scoper = sails.helpers.projects.makeScoper.with({ record: project });
    const userIds = await scoper.getProjectRelatedUserIds();

    userIds.forEach((userId) => {
      sails.sockets.broadcast(
        `user:${userId}`,
        'calendarEventCreate',
        {
          item: calendarEvent,
        },
        inputs.request,
      );
    });

    return calendarEvent;
  },
};
