/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'BoardDailySnapshot';

  static fields = {
    id: attr(),
    cardCount: attr(),
    snapshotDate: attr(),
    boardId: fk({
      to: 'Board',
      as: 'board',
      relatedName: 'dailySnapshots',
    }),
    listId: fk({
      to: 'List',
      as: 'list',
      relatedName: 'dailySnapshots',
    }),
  };

  static reducer({ type, payload }, BoardDailySnapshot) {
    switch (type) {
      case ActionTypes.BOARD_DAILY_SNAPSHOTS_FETCH__SUCCESS:
        if (payload.boardDailySnapshots) {
          payload.boardDailySnapshots.forEach((snapshot) => {
            BoardDailySnapshot.upsert(snapshot);
          });
        }

        break;
      default:
    }
  }
}
