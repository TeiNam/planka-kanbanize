/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'CalendarEvent';

  static fields = {
    id: attr(),
    name: attr(),
    eventKind: attr(),
    startAt: attr(),
    endAt: attr(),
    color: attr(),
    projectId: fk({
      to: 'Project',
      as: 'project',
      relatedName: 'calendarEvents',
    }),
    creatorUserId: fk({
      to: 'User',
      as: 'creatorUser',
      relatedName: 'createdCalendarEvents',
    }),
  };

  static reducer({ type, payload }, CalendarEvent) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_CREATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.calendarEvents) {
          payload.calendarEvents.forEach((calendarEvent) => {
            CalendarEvent.upsert(calendarEvent);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        CalendarEvent.all().delete();

        if (payload.calendarEvents) {
          payload.calendarEvents.forEach((calendarEvent) => {
            CalendarEvent.upsert(calendarEvent);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.calendarEvents) {
          payload.calendarEvents.forEach((calendarEvent) => {
            CalendarEvent.upsert(calendarEvent);
          });
        }

        break;
      case ActionTypes.CALENDAR_EVENT_CREATE:
      case ActionTypes.CALENDAR_EVENT_CREATE_HANDLE:
      case ActionTypes.CALENDAR_EVENT_UPDATE__SUCCESS:
      case ActionTypes.CALENDAR_EVENT_UPDATE_HANDLE:
        // 손상/잘못된 실시간 메시지(필수 필드 누락 등)는 스킵한다 (R12.4).
        // 정상 페이로드는 항상 id를 가지므로 가드를 통과한다.
        if (payload.calendarEvent && payload.calendarEvent.id !== undefined) {
          CalendarEvent.upsert(payload.calendarEvent);
        }

        break;
      case ActionTypes.CALENDAR_EVENT_CREATE__SUCCESS:
        CalendarEvent.withId(payload.localId).delete();
        CalendarEvent.upsert(payload.calendarEvent);

        break;
      case ActionTypes.CALENDAR_EVENT_CREATE__FAILURE:
        CalendarEvent.withId(payload.localId).delete();

        break;
      case ActionTypes.CALENDAR_EVENT_UPDATE:
        CalendarEvent.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.CALENDAR_EVENT_DELETE:
        CalendarEvent.withId(payload.id).delete();

        break;
      case ActionTypes.CALENDAR_EVENT_DELETE__SUCCESS:
      case ActionTypes.CALENDAR_EVENT_DELETE_HANDLE: {
        // 손상/잘못된 실시간 메시지(필수 필드 누락 등)는 스킵한다 (R12.4).
        if (!payload.calendarEvent || payload.calendarEvent.id === undefined) {
          break;
        }

        const calendarEventModel = CalendarEvent.withId(payload.calendarEvent.id);

        if (calendarEventModel) {
          calendarEventModel.delete();
        }

        break;
      }
      default:
    }
  }
}
