/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'Blocker';

  static fields = {
    id: attr(),
    reason: attr(),
    status: attr(),
    resolvedAt: attr(),
    cardId: fk({
      to: 'Card',
      as: 'card',
      relatedName: 'blockers',
    }),
    creatorUserId: fk({
      to: 'User',
      as: 'creatorUser',
      relatedName: 'createdBlockers',
    }),
  };

  static reducer({ type, payload }, Blocker) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.blockers) {
          payload.blockers.forEach((blocker) => {
            Blocker.upsert(blocker);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        Blocker.all().delete();

        if (payload.blockers) {
          payload.blockers.forEach((blocker) => {
            Blocker.upsert(blocker);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.blockers) {
          payload.blockers.forEach((blocker) => {
            Blocker.upsert(blocker);
          });
        }

        break;
      case ActionTypes.BLOCKER_CREATE:
      case ActionTypes.BLOCKER_CREATE_HANDLE:
      case ActionTypes.BLOCKER_UPDATE__SUCCESS:
      case ActionTypes.BLOCKER_UPDATE_HANDLE:
        Blocker.upsert(payload.blocker);

        break;
      case ActionTypes.BLOCKER_CREATE__SUCCESS:
        Blocker.withId(payload.localId).delete();
        Blocker.upsert(payload.blocker);

        break;
      case ActionTypes.BLOCKER_CREATE__FAILURE:
        Blocker.withId(payload.localId).delete();

        break;
      case ActionTypes.BLOCKER_UPDATE:
        Blocker.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.BLOCKER_DELETE:
        Blocker.withId(payload.id).delete();

        break;
      case ActionTypes.BLOCKER_DELETE__SUCCESS:
      case ActionTypes.BLOCKER_DELETE_HANDLE: {
        const blockerModel = Blocker.withId(payload.blocker.id);

        if (blockerModel) {
          blockerModel.delete();
        }

        break;
      }
      default:
    }
  }
}
