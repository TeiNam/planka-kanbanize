/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

const createCalendarEvent = (projectId, data, headers) =>
  socket.post(`/projects/${projectId}/calendar-events`, data, headers);

const updateCalendarEvent = (id, data, headers) =>
  socket.patch(`/calendar-events/${id}`, data, headers);

const deleteCalendarEvent = (id, headers) =>
  socket.delete(`/calendar-events/${id}`, undefined, headers);

// 월 단위 공휴일 조회 (읽기 전용 GET). 클라이언트는 endpoint 를 전달하지 않으며
// 서버가 project.holidayApiEndpoint 를 직접 읽는다 (SSRF 경계, R13.3).
// month 는 서버 규약상 1~12 이다 (JS Date 의 0-indexed 가 아님).
const fetchHolidays = (projectId, data, headers) =>
  socket.get(`/projects/${projectId}/holidays`, data, headers);

export default {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  fetchHolidays,
};
