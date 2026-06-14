/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createCalendarEventInCurrentProject = (data) => ({
  type: EntryActionTypes.CALENDAR_EVENT_IN_CURRENT_PROJECT_CREATE,
  payload: {
    data,
  },
});

const handleCalendarEventCreate = (calendarEvent) => ({
  type: EntryActionTypes.CALENDAR_EVENT_CREATE_HANDLE,
  payload: {
    calendarEvent,
  },
});

const updateCalendarEvent = (id, data) => ({
  type: EntryActionTypes.CALENDAR_EVENT_UPDATE,
  payload: {
    id,
    data,
  },
});

const handleCalendarEventUpdate = (calendarEvent) => ({
  type: EntryActionTypes.CALENDAR_EVENT_UPDATE_HANDLE,
  payload: {
    calendarEvent,
  },
});

const deleteCalendarEvent = (id) => ({
  type: EntryActionTypes.CALENDAR_EVENT_DELETE,
  payload: {
    id,
  },
});

const handleCalendarEventDelete = (calendarEvent) => ({
  type: EntryActionTypes.CALENDAR_EVENT_DELETE_HANDLE,
  payload: {
    calendarEvent,
  },
});

export default {
  createCalendarEventInCurrentProject,
  handleCalendarEventCreate,
  updateCalendarEvent,
  handleCalendarEventUpdate,
  deleteCalendarEvent,
  handleCalendarEventDelete,
};
