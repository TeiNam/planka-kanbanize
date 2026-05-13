/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* decoratorsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.DECORATOR_IN_CURRENT_BOARD_CREATE, ({ payload: { data } }) =>
      services.createDecoratorInCurrentBoard(data),
    ),
    takeEvery(EntryActionTypes.DECORATOR_CREATE_HANDLE, ({ payload: { decorator } }) =>
      services.handleDecoratorCreate(decorator),
    ),
    takeEvery(EntryActionTypes.DECORATOR_UPDATE, ({ payload: { id, data } }) =>
      services.updateDecorator(id, data),
    ),
    takeEvery(EntryActionTypes.DECORATOR_UPDATE_HANDLE, ({ payload: { decorator } }) =>
      services.handleDecoratorUpdate(decorator),
    ),
    takeEvery(EntryActionTypes.DECORATOR_DELETE, ({ payload: { id } }) =>
      services.deleteDecorator(id),
    ),
    takeEvery(EntryActionTypes.DECORATOR_DELETE_HANDLE, ({ payload: { decorator } }) =>
      services.handleDecoratorDelete(decorator),
    ),
  ]);
}
