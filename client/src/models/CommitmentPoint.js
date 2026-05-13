/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'CommitmentPoint';

  static fields = {
    id: attr(),
    position: attr(),
    label: attr(),
    type: attr(),
    boardId: fk({
      to: 'Board',
      as: 'board',
      relatedName: 'commitmentPoints',
    }),
    leftListId: fk({
      to: 'List',
      as: 'leftList',
      relatedName: 'commitmentPointsAsLeft',
    }),
    rightListId: fk({
      to: 'List',
      as: 'rightList',
      relatedName: 'commitmentPointsAsRight',
    }),
  };

  static reducer({ type, payload }, CommitmentPoint) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.commitmentPoints) {
          payload.commitmentPoints.forEach((commitmentPoint) => {
            CommitmentPoint.upsert(commitmentPoint);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        CommitmentPoint.all().delete();

        if (payload.commitmentPoints) {
          payload.commitmentPoints.forEach((commitmentPoint) => {
            CommitmentPoint.upsert(commitmentPoint);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.commitmentPoints) {
          payload.commitmentPoints.forEach((commitmentPoint) => {
            CommitmentPoint.upsert(commitmentPoint);
          });
        }

        break;
      case ActionTypes.COMMITMENT_POINT_CREATE:
      case ActionTypes.COMMITMENT_POINT_CREATE_HANDLE:
      case ActionTypes.COMMITMENT_POINT_UPDATE__SUCCESS:
      case ActionTypes.COMMITMENT_POINT_UPDATE_HANDLE:
        CommitmentPoint.upsert(payload.commitmentPoint);

        break;
      case ActionTypes.COMMITMENT_POINT_CREATE__SUCCESS:
        CommitmentPoint.withId(payload.localId).delete();
        CommitmentPoint.upsert(payload.commitmentPoint);

        break;
      case ActionTypes.COMMITMENT_POINT_CREATE__FAILURE:
        CommitmentPoint.withId(payload.localId).delete();

        break;
      case ActionTypes.COMMITMENT_POINT_UPDATE:
        CommitmentPoint.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.COMMITMENT_POINT_DELETE:
        CommitmentPoint.withId(payload.id).delete();

        break;
      case ActionTypes.COMMITMENT_POINT_DELETE__SUCCESS:
      case ActionTypes.COMMITMENT_POINT_DELETE_HANDLE: {
        const commitmentPointModel = CommitmentPoint.withId(payload.commitmentPoint.id);

        if (commitmentPointModel) {
          commitmentPointModel.delete();
        }

        break;
      }
      default:
    }
  }
}
