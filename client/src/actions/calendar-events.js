/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createCalendarEvent = (calendarEvent) => ({
  type: ActionTypes.CALENDAR_EVENT_CREATE,
  payload: {
    calendarEvent,
  },
});

createCalendarEvent.success = (localId, calendarEvent) => ({
  type: ActionTypes.CALENDAR_EVENT_CREATE__SUCCESS,
  payload: {
    localId,
    calendarEvent,
  },
});

createCalendarEvent.failure = (localId, error) => ({
  type: ActionTypes.CALENDAR_EVENT_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleCalendarEventCreate = (calendarEvent) => ({
  type: ActionTypes.CALENDAR_EVENT_CREATE_HANDLE,
  payload: {
    calendarEvent,
  },
});

const updateCalendarEvent = (id, data) => ({
  type: ActionTypes.CALENDAR_EVENT_UPDATE,
  payload: {
    id,
    data,
  },
});

updateCalendarEvent.success = (calendarEvent) => ({
  type: ActionTypes.CALENDAR_EVENT_UPDATE__SUCCESS,
  payload: {
    calendarEvent,
  },
});

updateCalendarEvent.failure = (id, error) => ({
  type: ActionTypes.CALENDAR_EVENT_UPDATE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleCalendarEventUpdate = (calendarEvent) => ({
  type: ActionTypes.CALENDAR_EVENT_UPDATE_HANDLE,
  payload: {
    calendarEvent,
  },
});

const deleteCalendarEvent = (id) => ({
  type: ActionTypes.CALENDAR_EVENT_DELETE,
  payload: {
    id,
  },
});

deleteCalendarEvent.success = (calendarEvent) => ({
  type: ActionTypes.CALENDAR_EVENT_DELETE__SUCCESS,
  payload: {
    calendarEvent,
  },
});

deleteCalendarEvent.failure = (id, error) => ({
  type: ActionTypes.CALENDAR_EVENT_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleCalendarEventDelete = (calendarEvent) => ({
  type: ActionTypes.CALENDAR_EVENT_DELETE_HANDLE,
  payload: {
    calendarEvent,
  },
});

export default {
  createCalendarEvent,
  handleCalendarEventCreate,
  updateCalendarEvent,
  handleCalendarEventUpdate,
  deleteCalendarEvent,
  handleCalendarEventDelete,
};
