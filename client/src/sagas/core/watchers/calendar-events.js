/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* calendarEventsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.CALENDAR_EVENT_IN_CURRENT_PROJECT_CREATE, ({ payload: { data } }) =>
      services.createCalendarEventInCurrentProject(data),
    ),
    takeEvery(EntryActionTypes.CALENDAR_EVENT_CREATE_HANDLE, ({ payload: { calendarEvent } }) =>
      services.handleCalendarEventCreate(calendarEvent),
    ),
    takeEvery(EntryActionTypes.CALENDAR_EVENT_UPDATE, ({ payload: { id, data } }) =>
      services.updateCalendarEvent(id, data),
    ),
    takeEvery(EntryActionTypes.CALENDAR_EVENT_UPDATE_HANDLE, ({ payload: { calendarEvent } }) =>
      services.handleCalendarEventUpdate(calendarEvent),
    ),
    takeEvery(EntryActionTypes.CALENDAR_EVENT_DELETE, ({ payload: { id } }) =>
      services.deleteCalendarEvent(id),
    ),
    takeEvery(EntryActionTypes.CALENDAR_EVENT_DELETE_HANDLE, ({ payload: { calendarEvent } }) =>
      services.handleCalendarEventDelete(calendarEvent),
    ),
  ]);
}
