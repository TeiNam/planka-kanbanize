/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'Decorator';

  static fields = {
    id: attr(),
    name: attr(),
    icon: attr(),
    color: attr(),
    boardId: fk({
      to: 'Board',
      as: 'board',
      relatedName: 'decorators',
    }),
  };

  static reducer({ type, payload }, Decorator) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.decorators) {
          payload.decorators.forEach((decorator) => {
            Decorator.upsert(decorator);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        Decorator.all().delete();

        if (payload.decorators) {
          payload.decorators.forEach((decorator) => {
            Decorator.upsert(decorator);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.decorators) {
          payload.decorators.forEach((decorator) => {
            Decorator.upsert(decorator);
          });
        }

        break;
      case ActionTypes.DECORATOR_CREATE:
      case ActionTypes.DECORATOR_CREATE_HANDLE:
      case ActionTypes.DECORATOR_UPDATE__SUCCESS:
      case ActionTypes.DECORATOR_UPDATE_HANDLE:
        Decorator.upsert(payload.decorator);

        break;
      case ActionTypes.DECORATOR_CREATE__SUCCESS:
        Decorator.withId(payload.localId).delete();
        Decorator.upsert(payload.decorator);

        break;
      case ActionTypes.DECORATOR_CREATE__FAILURE:
        Decorator.withId(payload.localId).delete();

        break;
      case ActionTypes.DECORATOR_UPDATE:
        Decorator.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.DECORATOR_DELETE:
        Decorator.withId(payload.id).delete();

        break;
      case ActionTypes.DECORATOR_DELETE__SUCCESS:
      case ActionTypes.DECORATOR_DELETE_HANDLE: {
        const decoratorModel = Decorator.withId(payload.decorator.id);

        if (decoratorModel) {
          decoratorModel.delete();
        }

        break;
      }
      default:
    }
  }
}
