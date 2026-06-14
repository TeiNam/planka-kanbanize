/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put, select } from 'redux-saga/effects';

import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

export function* createCalendarEvent(projectId, data) {
  // 낙관적 업데이트: 임시 localId로 먼저 스토어에 추가
  const localId = yield call(createLocalId);

  yield put(
    actions.createCalendarEvent({
      ...data,
      projectId,
      id: localId,
    }),
  );

  let calendarEvent;
  try {
    ({ item: calendarEvent } = yield call(request, api.createCalendarEvent, projectId, data));
  } catch (error) {
    // 실패 시 localId 기준으로 롤백
    yield put(actions.createCalendarEvent.failure(localId, error));
    return;
  }

  // 성공 시 localId를 서버가 반환한 실제 항목으로 교체
  yield put(actions.createCalendarEvent.success(localId, calendarEvent));
}

export function* createCalendarEventInCurrentProject(data) {
  const { projectId } = yield select(selectors.selectPath);

  yield call(createCalendarEvent, projectId, data);
}

export function* handleCalendarEventCreate(calendarEvent) {
  yield put(actions.handleCalendarEventCreate(calendarEvent));
}

export function* updateCalendarEvent(id, data) {
  yield put(actions.updateCalendarEvent(id, data));

  let calendarEvent;
  try {
    ({ item: calendarEvent } = yield call(request, api.updateCalendarEvent, id, data));
  } catch (error) {
    yield put(actions.updateCalendarEvent.failure(id, error));
    return;
  }

  yield put(actions.updateCalendarEvent.success(calendarEvent));
}

export function* handleCalendarEventUpdate(calendarEvent) {
  yield put(actions.handleCalendarEventUpdate(calendarEvent));
}

export function* deleteCalendarEvent(id) {
  yield put(actions.deleteCalendarEvent(id));

  let calendarEvent;
  try {
    ({ item: calendarEvent } = yield call(request, api.deleteCalendarEvent, id));
  } catch (error) {
    yield put(actions.deleteCalendarEvent.failure(id, error));
    return;
  }

  yield put(actions.deleteCalendarEvent.success(calendarEvent));
}

export function* handleCalendarEventDelete(calendarEvent) {
  yield put(actions.handleCalendarEventDelete(calendarEvent));
}

export default {
  createCalendarEvent,
  createCalendarEventInCurrentProject,
  handleCalendarEventCreate,
  updateCalendarEvent,
  handleCalendarEventUpdate,
  deleteCalendarEvent,
  handleCalendarEventDelete,
};
