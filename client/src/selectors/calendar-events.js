/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { selectPath } from './router';
import { isLocalId } from '../utils/local-id';

// 프로젝트별 캘린더 일정 목록 (startAt 정렬)
// startAt은 ISO 문자열이므로 사전식 정렬이 곧 시간순 정렬과 일치한다.
export const makeSelectCalendarEventsByProjectId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Project }, id) => {
      if (!id) {
        return id;
      }

      const projectModel = Project.withId(id);

      if (!projectModel) {
        return projectModel;
      }

      return projectModel.calendarEvents
        .orderBy('startAt')
        .toRefArray()
        .map((calendarEvent) => ({
          ...calendarEvent,
          isPersisted: !isLocalId(calendarEvent.id),
        }));
    },
  );

export const selectCalendarEventsByProjectId = makeSelectCalendarEventsByProjectId();

// 현재 프로젝트의 캘린더 일정 목록 (startAt 정렬) — 경로의 projectId 기반 편의 셀렉터
export const selectCalendarEventsForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  ({ Project }, id) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    return projectModel.calendarEvents
      .orderBy('startAt')
      .toRefArray()
      .map((calendarEvent) => ({
        ...calendarEvent,
        isPersisted: !isLocalId(calendarEvent.id),
      }));
  },
);

export default {
  makeSelectCalendarEventsByProjectId,
  selectCalendarEventsByProjectId,
  selectCalendarEventsForCurrentProject,
};
