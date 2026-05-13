/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { selectPath } from './router';
import { selectCurrentUserId } from './users';
import { isLocalId } from '../utils/local-id';
import { BoardContexts, ListTypes } from '../constants/Enums';

export const makeSelectListById = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ List }, id) => {
      const listModel = List.withId(id);

      if (!listModel) {
        return listModel;
      }

      return {
        ...listModel.ref,
        isPersisted: !isLocalId(id),
      };
    },
  );

export const selectListById = makeSelectListById();

// 부모 list의 sub-column 자식 list 수
export const makeSelectSubColumnCountByListId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ List }, id) => {
      if (!id) return 0;
      const listModel = List.withId(id);
      if (!listModel) return 0;
      return listModel.subColumns ? listModel.subColumns.count() : 0;
    },
  );

export const selectSubColumnCountByListId = makeSelectSubColumnCountByListId();

// 부모 list의 자식 sub-column ID 목록 (Active 먼저, Done 나중)
export const makeSelectSubColumnIdsByListId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ List }, id) => {
      if (!id) return null;
      const listModel = List.withId(id);
      if (!listModel || !listModel.subColumns) return null;
      const subColumns = listModel.subColumns.toRefArray();
      if (subColumns.length === 0) return null;
      return subColumns
        .slice()
        .sort((a, b) => {
          const order = (t) => (t === 'active' ? 0 : 1);
          return order(a.subColumnType) - order(b.subColumnType);
        })
        .map((l) => l.id);
    },
  );

export const selectSubColumnIdsByListId = makeSelectSubColumnIdsByListId();

export const makeSelectCardIdsByListId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ List }, id) => {
      const listModel = List.withId(id);

      if (!listModel) {
        return listModel;
      }

      return listModel.getCardsModelArray().map((cardModel) => cardModel.id);
    },
  );

export const selectCardIdsByListId = makeSelectCardIdsByListId();

export const makeSelectFilteredCardIdsByListId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ List }, id) => {
      const listModel = List.withId(id);

      if (!listModel) {
        return listModel;
      }

      return listModel.getFilteredCardsModelArray().map((cardModel) => cardModel.id);
    },
  );

export const selectFilteredCardIdsByListId = makeSelectFilteredCardIdsByListId();

export const selectIsListWithIdAvailableForCurrentUser = createSelector(
  orm,
  (_, id) => id,
  (state) => selectCurrentUserId(state),
  ({ List, User }, id, currentUserId) => {
    const listModel = List.withId(id);

    if (!listModel) {
      return false;
    }

    const currentUserModel = User.withId(currentUserId);
    return listModel.isAvailableForUser(currentUserModel);
  },
);

export const selectCurrentListId = createSelector(
  orm,
  (state) => selectPath(state).boardId,
  ({ Board }, id) => {
    if (!id) {
      return id;
    }

    const boardModel = Board.withId(id);

    if (!boardModel) {
      return boardModel;
    }

    if (boardModel.context === BoardContexts.BOARD) {
      return null;
    }

    const listModel = boardModel.lists
      .filter({
        type: boardModel.context || ListTypes.TASK, // TODO: hack?
      })
      .first();

    return listModel && listModel.id;
  },
);

export const selectCurrentList = createSelector(
  orm,
  (state) => selectCurrentListId(state),
  ({ List }, id) => {
    if (!id) {
      return id;
    }

    const listModel = List.withId(id);

    if (!listModel) {
      return listModel;
    }

    return listModel.ref;
  },
);

export const selectFirstKanbanListId = createSelector(
  orm,
  (state) => selectPath(state).boardId,
  ({ Board }, id) => {
    if (!id) {
      return id;
    }

    const boardModel = Board.withId(id);

    if (!boardModel) {
      return boardModel;
    }

    const listModel = boardModel.getKanbanListsQuerySet().first();
    return listModel && listModel.id;
  },
);

export const selectFilteredCardIdsForCurrentList = createSelector(
  orm,
  (state) => selectCurrentListId(state),
  ({ List }, id) => {
    if (!id) {
      return id;
    }

    const listModel = List.withId(id);

    if (!listModel) {
      return listModel;
    }

    return listModel.getFilteredCardsModelArray().map((cardModel) => cardModel.id);
  },
);

// 리스트 내 현재 카드 수 (WIP 카운트)
// 부모 list라 자식 sub-column이 있으면 자식 카드까지 합산한다.
export const makeSelectWipCount = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ List }, id) => {
      if (!id) {
        return 0;
      }

      const listModel = List.withId(id);

      if (!listModel) {
        return 0;
      }

      let total = listModel.cards.count();
      if (listModel.subColumns) {
        listModel.subColumns.toModelArray().forEach((child) => {
          total += child.cards.count();
        });
      }
      return total;
    },
  );

export const selectWipCount = makeSelectWipCount();

// 리스트의 빈 슬롯 수: max(0, wipLimit - currentCount), wipLimit 미설정 시 0
export const makeSelectEmptySlots = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ List }, id) => {
      if (!id) {
        return 0;
      }

      const listModel = List.withId(id);

      if (!listModel) {
        return 0;
      }

      const { wipLimit } = listModel.ref;

      if (wipLimit === null || wipLimit === undefined) {
        return 0;
      }

      const currentCount = listModel.cards.count();
      return Math.max(0, wipLimit - currentCount);
    },
  );

export const selectEmptySlots = makeSelectEmptySlots();

export default {
  makeSelectListById,
  selectListById,
  makeSelectCardIdsByListId,
  selectCardIdsByListId,
  makeSelectFilteredCardIdsByListId,
  selectFilteredCardIdsByListId,
  selectIsListWithIdAvailableForCurrentUser,
  selectCurrentListId,
  selectCurrentList,
  selectFirstKanbanListId,
  selectFilteredCardIdsForCurrentList,
  makeSelectWipCount,
  selectWipCount,
  makeSelectEmptySlots,
  selectEmptySlots,
  makeSelectSubColumnCountByListId,
  selectSubColumnCountByListId,
  makeSelectSubColumnIdsByListId,
  selectSubColumnIdsByListId,
};
