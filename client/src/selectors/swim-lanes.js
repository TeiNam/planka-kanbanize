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

// 보드의 Expedite 레인 (없으면 null)
export const makeSelectExpediteLaneByBoardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board }, id) => {
      if (!id) return null;
      const boardModel = Board.withId(id);
      if (!boardModel) return null;
      const lane = boardModel.swimLanes.filter((sl) => sl.type === 'expedite').first();
      return lane ? lane.ref : null;
    },
  );

export const selectExpediteLaneByBoardId = makeSelectExpediteLaneByBoardId();

// Expedite 레인의 현재 카드 수 (Expedite 레인의 task 컬럼/하위 sub-column 카드만 — backlog/closed/discard 제외)
export const makeSelectExpediteLaneCardCount = () =>
  createSelector(
    orm,
    (_, boardId) => boardId,
    ({ Board, List, Card }, boardId) => {
      if (!boardId) return 0;
      const boardModel = Board.withId(boardId);
      if (!boardModel) return 0;
      const lane = boardModel.swimLanes.filter((sl) => sl.type === 'expedite').first();
      if (!lane) return 0;

      // 1) Expedite 레인의 task 부모 컬럼 ID
      const taskParentIds = new Set(
        List.filter((l) => l.swimLaneId === lane.id && l.type === 'task' && !l.parentListId)
          .toRefArray()
          .map((l) => l.id),
      );
      if (taskParentIds.size === 0) return 0;

      // 2) 해당 task 부모의 sub-column ID도 합산 대상에 포함
      const countableListIds = new Set(taskParentIds);
      List.filter((l) => l.parentListId && taskParentIds.has(l.parentListId))
        .toRefArray()
        .forEach((l) => countableListIds.add(l.id));

      const fn = (c) => c.swimLaneId === lane.id && countableListIds.has(c.listId);
      return Card.filter(fn).count();
    },
  );

export const selectExpediteLaneCardCount = makeSelectExpediteLaneCardCount();

export default {
  makeSelectSwimLanesByBoardId,
  selectSwimLanesByBoardId,
  makeSelectSwimLaneWipCount,
  selectSwimLaneWipCount,
  makeSelectSwimLaneWipExceeded,
  selectSwimLaneWipExceeded,
  makeSelectExpediteLaneByBoardId,
  selectExpediteLaneByBoardId,
  makeSelectExpediteLaneCardCount,
  selectExpediteLaneCardCount,
};
