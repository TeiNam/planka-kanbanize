/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* cardDecoratorsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.CARD_DECORATOR_CREATE, ({ payload: { cardId, decoratorId } }) =>
      services.createCardDecorator(cardId, decoratorId),
    ),
    takeEvery(EntryActionTypes.CARD_DECORATOR_CREATE_HANDLE, ({ payload: { cardDecorator } }) =>
      services.handleCardDecoratorCreate(cardDecorator),
    ),
    takeEvery(EntryActionTypes.CARD_DECORATOR_DELETE, ({ payload: { id } }) =>
      services.deleteCardDecorator(id),
    ),
    takeEvery(EntryActionTypes.CARD_DECORATOR_DELETE_HANDLE, ({ payload: { cardDecorator } }) =>
      services.handleCardDecoratorDelete(cardDecorator),
    ),
  ]);
}
