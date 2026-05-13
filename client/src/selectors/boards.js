/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { selectPath } from './router';
import { selectCurrentUserId } from './users';
import { isLocalId } from '../utils/local-id';
import { isListArchiveOrTrash } from '../utils/record-helpers';
import { ListTypes } from '../constants/Enums';

export const makeSelectBoardById = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectPath(state).boardId,
    ({ Board }, id) => {
      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      return {
        ...boardModel.ref,
        isPersisted: !isLocalId(boardModel.id),
      };
    },
  );

export const selectBoardById = makeSelectBoardById();

export const makeSelectCurrentUserMembershipByBoardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Board }, id, currentUserId) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      const boardMembershipModel = boardModel.getMembershipModelByUserId(currentUserId);

      if (!boardMembershipModel) {
        return boardMembershipModel;
      }

      return boardMembershipModel.ref;
    },
  );

const selectCurrentUserMembershipByBoardId = makeSelectCurrentUserMembershipByBoardId();

export const makeSelectNotificationsTotalByBoardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Board }, id) => {
      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      return boardModel.getUnreadNotificationsQuerySet().count();
    },
  );

export const selectNotificationsTotalByBoardId = makeSelectNotificationsTotalByBoardId();

export const makeSelectNotificationServiceIdsByBoardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Board }, id) => {
      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      return boardModel
        .getNotificationServicesQuerySet()
        .toRefArray()
        .map((notificationService) => notificationService.id);
    },
  );

export const selectNotificationServiceIdsByBoardId = makeSelectNotificationServiceIdsByBoardId();

export const selectIsBoardWithIdAvailableForCurrentUser = createSelector(
  orm,
  (_, id) => id,
  (state) => selectCurrentUserId(state),
  ({ Board, User }, id, currentUserId) => {
    const boardModel = Board.withId(id);

    if (!boardModel) {
      return false;
    }

    const currentUserModel = User.withId(currentUserId);
    return boardModel.isAvailableForUser(currentUserModel);
  },
);

export const selectCurrentBoard = createSelector(
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

    return boardModel.ref;
  },
);

export const selectMembershipsForCurrentBoard = createSelector(
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

    return boardModel
      .getMembershipsQuerySet()
      .toModelArray()
      .map((boardMembershipModel) => ({
        ...boardMembershipModel.ref,
        isPersisted: !isLocalId(boardMembershipModel.id),
        user: boardMembershipModel.user.ref,
      }));
  },
);

export const selectMemberUserIdsForCurrentBoard = createSelector(
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

    return boardModel
      .getMembershipsQuerySet()
      .toModelArray()
      .map((boardMembershipModel) => boardMembershipModel.user.id);
  },
);

export const selectCurrentUserMembershipForCurrentBoard = createSelector(
  orm,
  (state) => selectPath(state).boardId,
  (state) => selectCurrentUserId(state),
  ({ Board }, id, currentUserId) => {
    if (!id) {
      return id;
    }

    const boardModel = Board.withId(id);

    if (!boardModel) {
      return boardModel;
    }

    const boardMembershipModel = boardModel.getMembershipModelByUserId(currentUserId);

    if (!boardMembershipModel) {
      return boardMembershipModel;
    }

    return boardMembershipModel.ref;
  },
);

export const selectLabelsForCurrentBoard = createSelector(
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

    return boardModel.getLabelsQuerySet().toRefArray();
  },
);

export const selectArchiveListIdForCurrentBoard = createSelector(
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

    const listModel = boardModel.lists
      .filter({
        type: ListTypes.ARCHIVE,
      })
      .first();

    return listModel.id;
  },
);

export const selectTrashListIdForCurrentBoard = createSelector(
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

    const listModel = boardModel.lists
      .filter({
        type: ListTypes.TRASH,
      })
      .first();

    return listModel.id;
  },
);

export const selectKanbanListIdsForCurrentBoard = createSelector(
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

    return boardModel
      .getKanbanListsQuerySet()
      .toRefArray()
      .map((list) => list.id);
  },
);

// TODO: rename?
export const selectAvailableListsForCurrentBoard = createSelector(
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

    return boardModel
      .getListsQuerySet()
      .toRefArray()
      .filter((list) => !isListArchiveOrTrash(list));
  },
);

export const selectCardsExceptCurrentForCurrentBoard = createSelector(
  orm,
  (state) => selectPath(state).boardId,
  (state) => selectPath(state).cardId,
  ({ Board }, id, cardId) => {
    if (!id) {
      return id;
    }

    const boardModel = Board.withId(id);

    if (!boardModel) {
      return boardModel;
    }

    return boardModel
      .getCardsModelArray()
      .filter((cardModel) => cardModel.id !== cardId)
      .map((cardModel) => cardModel.ref);
  },
);

export const selectFilteredCardIdsForCurrentBoard = createSelector(
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

    return boardModel.getFilteredCardsModelArray().map((cardModel) => cardModel.id);
  },
);

// 보드 전체 Total WIP 계산용: wipLimit이 설정된 태스크 컬럼의 카드만 카운트한다.
// wipLimit이 없는 task 컬럼(예: UAT, Buffer류)은 "관리되지 않는 무제한 컬럼"으로 간주하여
// 분자(n)와 분모(systemWipLimit) 양쪽에서 모두 제외한다.
export const selectTaskCardIdsForCurrentBoard = createSelector(
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

    const limitedTaskListModels = boardModel
      .getKanbanListsQuerySet()
      .toModelArray()
      .filter(
        (listModel) =>
          listModel.type === ListTypes.TASK &&
          listModel.wipLimit !== null &&
          listModel.wipLimit !== undefined,
      );

    const cardIds = [];
    limitedTaskListModels.forEach((listModel) => {
      // 부모 list 자체 카드
      listModel.getFilteredCardsModelArray().forEach((cardModel) => {
        cardIds.push(cardModel.id);
      });
      // 자식 sub-column(Active/Done) 카드도 합산 — Phase 2에서 카드들이 자식 list로 이동
      if (listModel.subColumns) {
        listModel.subColumns.toModelArray().forEach((child) => {
          // 자식 list는 getFilteredCardsModelArray가 없으므로 직접 cards 사용
          child.cards.toModelArray().forEach((cardModel) => {
            cardIds.push(cardModel.id);
          });
        });
      }
    });
    return cardIds;
  },
);

export const selectCustomFieldGroupIdsForCurrentBoard = createSelector(
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

    return boardModel
      .getCustomFieldGroupsQuerySet()
      .toRefArray()
      .map((customFieldGroup) => customFieldGroup.id);
  },
);

export const selectCustomFieldGroupsForCurrentBoard = createSelector(
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

    return boardModel
      .getCustomFieldGroupsQuerySet()
      .toModelArray()
      .map((customFieldGroupModel) => {
        if (!customFieldGroupModel.name) {
          return {
            ...customFieldGroupModel.ref,
            name: customFieldGroupModel.baseCustomFieldGroup.name,
          };
        }

        return customFieldGroupModel.ref;
      });
  },
);

export const selectActivityIdsForCurrentBoard = createSelector(
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

    return boardModel.getActivitiesModelArray().map((activity) => activity.id);
  },
);

export const selectFilterUserIdsForCurrentBoard = createSelector(
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

    return boardModel.filterUsers.toRefArray().map((user) => user.id);
  },
);

export const selectFilterLabelIdsForCurrentBoard = createSelector(
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

    return boardModel.filterLabels.toRefArray().map((label) => label.id);
  },
);

export const selectIsBoardWithIdExists = createSelector(
  orm,
  (_, id) => id,
  ({ Board }, id) => Board.idExists(id),
);

export default {
  makeSelectBoardById,
  selectBoardById,
  makeSelectCurrentUserMembershipByBoardId,
  selectCurrentUserMembershipByBoardId,
  makeSelectNotificationsTotalByBoardId,
  selectNotificationsTotalByBoardId,
  makeSelectNotificationServiceIdsByBoardId,
  selectNotificationServiceIdsByBoardId,
  selectIsBoardWithIdAvailableForCurrentUser,
  selectCurrentBoard,
  selectMembershipsForCurrentBoard,
  selectMemberUserIdsForCurrentBoard,
  selectCurrentUserMembershipForCurrentBoard,
  selectLabelsForCurrentBoard,
  selectArchiveListIdForCurrentBoard,
  selectTrashListIdForCurrentBoard,
  selectKanbanListIdsForCurrentBoard,
  selectAvailableListsForCurrentBoard,
  selectCardsExceptCurrentForCurrentBoard,
  selectFilteredCardIdsForCurrentBoard,
  selectTaskCardIdsForCurrentBoard,
  selectCustomFieldGroupIdsForCurrentBoard,
  selectCustomFieldGroupsForCurrentBoard,
  selectActivityIdsForCurrentBoard,
  selectFilterUserIdsForCurrentBoard,
  selectFilterLabelIdsForCurrentBoard,
  selectIsBoardWithIdExists,
};
