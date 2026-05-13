/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'ClassOfService';

  static fields = {
    id: attr(),
    name: attr(),
    type: attr(),
    color: attr(),
    policy: attr(),
    position: attr(),
    isDefault: attr(),
    boardId: fk({
      to: 'Board',
      as: 'board',
      relatedName: 'classesOfService',
    }),
  };

  static reducer({ type, payload }, ClassOfService) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.classesOfService) {
          payload.classesOfService.forEach((classOfService) => {
            ClassOfService.upsert(classOfService);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        ClassOfService.all().delete();

        if (payload.classesOfService) {
          payload.classesOfService.forEach((classOfService) => {
            ClassOfService.upsert(classOfService);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.classesOfService) {
          payload.classesOfService.forEach((classOfService) => {
            ClassOfService.upsert(classOfService);
          });
        }

        break;
      case ActionTypes.CLASS_OF_SERVICE_CREATE:
      case ActionTypes.CLASS_OF_SERVICE_CREATE_HANDLE:
      case ActionTypes.CLASS_OF_SERVICE_UPDATE__SUCCESS:
      case ActionTypes.CLASS_OF_SERVICE_UPDATE_HANDLE:
        ClassOfService.upsert(payload.classOfService);

        break;
      case ActionTypes.CLASS_OF_SERVICE_CREATE__SUCCESS:
        ClassOfService.withId(payload.localId).delete();
        ClassOfService.upsert(payload.classOfService);

        break;
      case ActionTypes.CLASS_OF_SERVICE_CREATE__FAILURE:
        ClassOfService.withId(payload.localId).delete();

        break;
      case ActionTypes.CLASS_OF_SERVICE_UPDATE:
        ClassOfService.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.CLASS_OF_SERVICE_DELETE:
        ClassOfService.withId(payload.id).delete();

        break;
      case ActionTypes.CLASS_OF_SERVICE_DELETE__SUCCESS:
      case ActionTypes.CLASS_OF_SERVICE_DELETE_HANDLE: {
        const classOfServiceModel = ClassOfService.withId(payload.classOfService.id);

        if (classOfServiceModel) {
          classOfServiceModel.delete();
        }

        break;
      }
      default:
    }
  }
}
