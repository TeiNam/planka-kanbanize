/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'SwimLane';

  static fields = {
    id: attr(),
    position: attr(),
    name: attr(),
    category: attr(),
    type: attr(),
    wipLimit: attr(),
    color: attr(),
    boardId: fk({
      to: 'Board',
      as: 'board',
      relatedName: 'swimLanes',
    }),
  };

  static reducer({ type, payload }, SwimLane) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.swimLanes) {
          payload.swimLanes.forEach((swimLane) => {
            SwimLane.upsert(swimLane);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        SwimLane.all().delete();

        if (payload.swimLanes) {
          payload.swimLanes.forEach((swimLane) => {
            SwimLane.upsert(swimLane);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.swimLanes) {
          payload.swimLanes.forEach((swimLane) => {
            SwimLane.upsert(swimLane);
          });
        }

        break;
      case ActionTypes.SWIM_LANE_CREATE:
      case ActionTypes.SWIM_LANE_CREATE_HANDLE:
      case ActionTypes.SWIM_LANE_UPDATE__SUCCESS:
      case ActionTypes.SWIM_LANE_UPDATE_HANDLE:
        SwimLane.upsert(payload.swimLane);

        break;
      case ActionTypes.SWIM_LANE_CREATE__SUCCESS:
        SwimLane.withId(payload.localId).delete();
        SwimLane.upsert(payload.swimLane);

        break;
      case ActionTypes.SWIM_LANE_CREATE__FAILURE:
        SwimLane.withId(payload.localId).delete();

        break;
      case ActionTypes.SWIM_LANE_UPDATE:
        SwimLane.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.SWIM_LANE_SORT__SUCCESS:
        payload.swimLanes.forEach((swimLane) => {
          SwimLane.upsert(swimLane);
        });

        break;
      case ActionTypes.SWIM_LANE_DELETE:
        SwimLane.withId(payload.id).delete();

        break;
      case ActionTypes.SWIM_LANE_DELETE__SUCCESS:
      case ActionTypes.SWIM_LANE_DELETE_HANDLE: {
        const swimLaneModel = SwimLane.withId(payload.swimLane.id);

        if (swimLaneModel) {
          swimLaneModel.delete();
        }

        break;
      }
      default:
    }
  }
}
