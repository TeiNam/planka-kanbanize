/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { isLocalId } from '../utils/local-id';

// 보드별 Commitment Point 목록 (position 정렬)
export const makeSelectCommitmentPointsByBoardId = () =>
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

      return boardModel.commitmentPoints
        .orderBy('position')
        .toRefArray()
        .map((commitmentPoint) => ({
          ...commitmentPoint,
          isPersisted: !isLocalId(commitmentPoint.id),
        }));
    },
  );

export const selectCommitmentPointsByBoardId = makeSelectCommitmentPointsByBoardId();

// 카드가 특정 Commitment Point를 통과했는지 여부
export const makeSelectIsCardBeyondCommitmentPoint = () =>
  createSelector(
    orm,
    (_, cardId) => cardId,
    (_, __, commitmentPointId) => commitmentPointId,
    ({ Card, CommitmentPoint, Board }, cardId, commitmentPointId) => {
      if (!cardId || !commitmentPointId) {
        return false;
      }

      const cardModel = Card.withId(cardId);

      if (!cardModel) {
        return false;
      }

      const commitmentPointModel = CommitmentPoint.withId(commitmentPointId);

      if (!commitmentPointModel) {
        return false;
      }

      const boardModel = Board.withId(cardModel.boardId);

      if (!boardModel) {
        return false;
      }

      // 보드의 칸반 리스트를 position 순으로 가져옴
      const lists = boardModel.lists.orderBy('position').toRefArray();
      const cardListIndex = lists.findIndex((list) => list.id === cardModel.listId);
      const rightListIndex = lists.findIndex(
        (list) => list.id === commitmentPointModel.rightListId,
      );

      // 카드의 리스트가 CP의 rightList 이후에 있으면 통과한 것
      return cardListIndex >= rightListIndex;
    },
  );

export const selectIsCardBeyondCommitmentPoint = makeSelectIsCardBeyondCommitmentPoint();

export default {
  makeSelectCommitmentPointsByBoardId,
  selectCommitmentPointsByBoardId,
  makeSelectIsCardBeyondCommitmentPoint,
  selectIsCardBeyondCommitmentPoint,
};
