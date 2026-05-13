/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { isLocalId } from '../utils/local-id';

// 보드별 스윔레인 목록 (position 정렬)
export const makeSelectSwimLanesByBoardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board }, id) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      return boardModel.swimLanes
        .orderBy('position')
        .toRefArray()
        .map((swimLane) => ({
          ...swimLane,
          isPersisted: !isLocalId(swimLane.id),
        }));
    },
  );

export const selectSwimLanesByBoardId = makeSelectSwimLanesByBoardId();

// 스윔레인 내 현재 카드 수 (WIP 카운트)
export const makeSelectSwimLaneWipCount = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ SwimLane, Card }, id) => {
      if (!id) {
        return 0;
      }

      const swimLaneModel = SwimLane.withId(id);

      if (!swimLaneModel) {
        return 0;
      }

      return Card.filter({ swimLaneId: id }).count();
    },
  );

export const selectSwimLaneWipCount = makeSelectSwimLaneWipCount();

// 스윔레인 WIP 초과 여부
export const makeSelectSwimLaneWipExceeded = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ SwimLane, Card }, id) => {
      if (!id) {
        return false;
      }

      const swimLaneModel = SwimLane.withId(id);

      if (!swimLaneModel) {
        return false;
      }

      if (swimLaneModel.wipLimit === null || swimLaneModel.wipLimit === undefined) {
        return false;
      }

      const currentCount = Card.filter({ swimLaneId: id }).count();
      return currentCount > swimLaneModel.wipLimit;
    },
  );

export const selectSwimLaneWipExceeded = makeSelectSwimLaneWipExceeded();

export default {
  makeSelectSwimLanesByBoardId,
  selectSwimLanesByBoardId,
  makeSelectSwimLaneWipCount,
  selectSwimLaneWipCount,
  makeSelectSwimLaneWipExceeded,
  selectSwimLaneWipExceeded,
};
