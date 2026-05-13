/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* classesOfServiceWatchers() {
  yield all([
    takeEvery(EntryActionTypes.CLASS_OF_SERVICE_IN_CURRENT_BOARD_CREATE, ({ payload: { data } }) =>
      services.createClassOfServiceInCurrentBoard(data),
    ),
    takeEvery(EntryActionTypes.CLASS_OF_SERVICE_CREATE_HANDLE, ({ payload: { classOfService } }) =>
      services.handleClassOfServiceCreate(classOfService),
    ),
    takeEvery(EntryActionTypes.CLASS_OF_SERVICE_UPDATE, ({ payload: { id, data } }) =>
      services.updateClassOfService(id, data),
    ),
    takeEvery(EntryActionTypes.CLASS_OF_SERVICE_UPDATE_HANDLE, ({ payload: { classOfService } }) =>
      services.handleClassOfServiceUpdate(classOfService),
    ),
    takeEvery(EntryActionTypes.CLASS_OF_SERVICE_DELETE, ({ payload: { id } }) =>
      services.deleteClassOfService(id),
    ),
    takeEvery(EntryActionTypes.CLASS_OF_SERVICE_DELETE_HANDLE, ({ payload: { classOfService } }) =>
      services.handleClassOfServiceDelete(classOfService),
    ),
  ]);
}
