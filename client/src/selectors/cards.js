/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { selectRecentCardId } from './core';
import { selectPath } from './router';
import { selectCurrentUserId } from './users';
import { buildCustomFieldValueId } from '../models/CustomFieldValue';
import { isLocalId } from '../utils/local-id';

export const makeSelectCardById = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return {
        ...cardModel.ref,
        isPersisted: !isLocalId(id),
      };
    },
  );

export const selectCardById = makeSelectCardById();

export const makeSelectCardIndexById = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.list
        .getCardsModelArray()
        .findIndex((cardModelItem) => cardModelItem.id === cardModel.id);
    },
  );

export const selectCardIndexById = makeSelectCardIndexById();

export const makeSelectUserIdsByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.users.toRefArray().map((user) => user.id);
    },
  );

export const selectUserIdsByCardId = makeSelectUserIdsByCardId();

export const makeSelectLabelIdsByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.labels.toRefArray().map((label) => label.id);
    },
  );

export const selectLabelIdsByCardId = makeSelectLabelIdsByCardId();

export const makeSelectShownOnFrontOfCardTaskListIdsByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.getShownOnFrontOfCardTaskListsModelArray().map((taskList) => taskList.id);
    },
  );

export const selectShownOnFrontOfCardTaskListIdsByCardId =
  makeSelectShownOnFrontOfCardTaskListIdsByCardId();

export const makeSelectAttachmentsTotalByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.attachments.count();
    },
  );

export const selectAttachmentsTotalByCardId = makeSelectAttachmentsTotalByCardId();

export const makeSelectShownOnFrontOfCardCustomFieldValueIdsByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card, CustomFieldValue }, id) => {
      if (!id) {
        return id;
      }

      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return [
        ...cardModel.board
          .getCustomFieldGroupsQuerySet()
          .toModelArray()
          .flatMap((customFieldGroupModel) =>
            customFieldGroupModel
              .getShownOnFrontOfCardCustomFieldsModelArray()
              .flatMap((customFieldModel) => {
                const customFieldValue = CustomFieldValue.withId(
                  buildCustomFieldValueId({
                    cardId: id,
                    customFieldGroupId: customFieldGroupModel.id,
                    customFieldId: customFieldModel.id,
                  }),
                );

                return customFieldValue ? customFieldValue.id : [];
              }),
          ),
        ...cardModel
          .getCustomFieldGroupsQuerySet()
          .toModelArray()
          .flatMap((customFieldGroupModel) =>
            customFieldGroupModel
              .getShownOnFrontOfCardCustomFieldsModelArray()
              .flatMap((customFieldModel) => {
                const customFieldValue = CustomFieldValue.withId(
                  buildCustomFieldValueId({
                    cardId: id,
                    customFieldGroupId: customFieldGroupModel.id,
                    customFieldId: customFieldModel.id,
                  }),
                );

                return customFieldValue ? customFieldValue.id : [];
              }),
          ),
      ];
    },
  );

export const selectShownOnFrontOfCardCustomFieldValueIdsByCardId =
  makeSelectShownOnFrontOfCardCustomFieldValueIdsByCardId();

export const makeSelectNotificationsByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.getUnreadNotificationsQuerySet().toRefArray();
    },
  );

export const selectNotificationsByCardId = makeSelectNotificationsByCardId();

export const makeSelectNotificationsTotalByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.getUnreadNotificationsQuerySet().count();
    },
  );

export const selectNotificationsTotalByCardId = makeSelectNotificationsTotalByCardId();

export const makeSelectIsCardWithIdRecent = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectRecentCardId(state),
    ({ Card }, id, recentCardId) => {
      const cardModel = Card.withId(id);

      if (!cardModel) {
        return false;
      }

      return cardModel.id === recentCardId;
    },
  );

export const selectIsCardWithIdRecent = makeSelectIsCardWithIdRecent();

export const selectIsCardWithIdAvailableForCurrentUser = createSelector(
  orm,
  (_, id) => id,
  (state) => selectCurrentUserId(state),
  ({ Card, User }, id, currentUserId) => {
    const cardModel = Card.withId(id);

    if (!cardModel) {
      return false;
    }

    const currentUserModel = User.withId(currentUserId);
    return cardModel.isAvailableForUser(currentUserModel);
  },
);

export const selectCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel.ref;
  },
);

export const selectUserIdsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel.users.toRefArray().map((user) => user.id);
  },
);

export const selectLabelIdsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel.labels.toRefArray().map((label) => label.id);
  },
);

export const selectTaskListIdsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel
      .getTaskListsQuerySet()
      .toRefArray()
      .map((taskList) => taskList.id);
  },
);

export const selectAttachmentIdsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel
      .getAttachmentsQuerySet()
      .toRefArray()
      .map((attachment) => attachment.id);
  },
);

export const selectImageAttachmentIdsExceptCoverForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel
      .getAttachmentsQuerySet()
      .toModelArray()
      .filter(
        (attachmentModel) =>
          attachmentModel.data && attachmentModel.data.image && !attachmentModel.coveredCard,
      )
      .map((attachmentModel) => attachmentModel.id);
  },
);

export const selectAttachmentsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel.getAttachmentsQuerySet().toRefArray();
  },
);

export const selectCustomFieldGroupIdsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel
      .getCustomFieldGroupsQuerySet()
      .toRefArray()
      .map((customFieldGroup) => customFieldGroup.id);
  },
);

export const selectCommentIdsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel.getCommentsModelArray().map((commentModel) => commentModel.id);
  },
);

export const selectActivityIdsForCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  ({ Card }, id) => {
    if (!id) {
      return id;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return cardModel;
    }

    return cardModel.getActivitiesModelArray().map((activity) => activity.id);
  },
);

export const selectIsCurrentUserInCurrentCard = createSelector(
  orm,
  (state) => selectPath(state).cardId,
  (state) => selectCurrentUserId(state),
  ({ Card }, id, currentUserId) => {
    if (!id) {
      return false;
    }

    const cardModel = Card.withId(id);

    if (!cardModel) {
      return false;
    }

    return cardModel.hasUserWithId(currentUserId);
  },
);

// SLA 진행률 계산: { ratio, color }
export const makeSelectSlaProgress = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      if (!id) {
        return null;
      }

      const cardModel = Card.withId(id);

      if (!cardModel) {
        return null;
      }

      const { startDate, dueDate, createdAt } = cardModel.ref;

      if (!dueDate) {
        return null;
      }

      // Start 날짜 미설정 시 카드 생성일을 사용 (Requirement 4.5)
      const start = new Date(startDate || createdAt);
      const now = new Date();
      const due = new Date(dueDate);
      const totalDuration = due - start;

      if (totalDuration <= 0) {
        return { ratio: 1, color: 'red' };
      }

      const elapsed = now - start;
      const ratio = Math.max(0, elapsed / totalDuration);

      let color;
      if (ratio <= 0.8) {
        color = 'green';
      } else if (ratio <= 1.0) {
        color = 'orange';
      } else {
        color = 'red';
      }

      return { ratio: Math.round(ratio * 100) / 100, color };
    },
  );

export const selectSlaProgress = makeSelectSlaProgress();

// 티켓 나이 계산 (일수)
export const makeSelectTicketAge = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      if (!id) {
        return 0;
      }

      const cardModel = Card.withId(id);

      if (!cardModel) {
        return 0;
      }

      const now = new Date();
      const entryDate = new Date(cardModel.ref.startDate || cardModel.ref.createdAt);
      const diffMs = now - entryDate;

      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    },
  );

export const selectTicketAge = makeSelectTicketAge();

// Pull 가능 카드 여부: 다음 컬럼에 빈 슬롯이 있는지
export const makeSelectIsPullableCard = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card, Board }, id) => {
      if (!id) {
        return false;
      }

      const cardModel = Card.withId(id);

      if (!cardModel) {
        return false;
      }

      const boardModel = Board.withId(cardModel.boardId);

      if (!boardModel) {
        return false;
      }

      const lists = boardModel.lists.orderBy('position').toModelArray();
      const currentListIndex = lists.findIndex((list) => list.id === cardModel.listId);

      if (currentListIndex < 0 || currentListIndex >= lists.length - 1) {
        return false;
      }

      const nextList = lists[currentListIndex + 1];
      const { wipLimit: nextWipLimit } = nextList.ref;

      if (nextWipLimit === null || nextWipLimit === undefined) {
        return false;
      }

      const nextCardCount = nextList.cards.count();
      return nextCardCount < nextWipLimit;
    },
  );

export const selectIsPullableCard = makeSelectIsPullableCard();

export default {
  makeSelectCardById,
  selectCardById,
  makeSelectCardIndexById,
  selectCardIndexById,
  makeSelectUserIdsByCardId,
  selectUserIdsByCardId,
  makeSelectLabelIdsByCardId,
  selectLabelIdsByCardId,
  makeSelectShownOnFrontOfCardTaskListIdsByCardId,
  selectShownOnFrontOfCardTaskListIdsByCardId,
  makeSelectAttachmentsTotalByCardId,
  makeSelectShownOnFrontOfCardCustomFieldValueIdsByCardId,
  selectShownOnFrontOfCardCustomFieldValueIdsByCardId,
  selectAttachmentsTotalByCardId,
  makeSelectNotificationsByCardId,
  selectNotificationsByCardId,
  makeSelectNotificationsTotalByCardId,
  selectNotificationsTotalByCardId,
  makeSelectIsCardWithIdRecent,
  selectIsCardWithIdRecent,
  selectIsCardWithIdAvailableForCurrentUser,
  selectCurrentCard,
  selectUserIdsForCurrentCard,
  selectLabelIdsForCurrentCard,
  selectTaskListIdsForCurrentCard,
  selectAttachmentIdsForCurrentCard,
  selectImageAttachmentIdsExceptCoverForCurrentCard,
  selectAttachmentsForCurrentCard,
  selectCustomFieldGroupIdsForCurrentCard,
  selectCommentIdsForCurrentCard,
  selectActivityIdsForCurrentCard,
  selectIsCurrentUserInCurrentCard,
  makeSelectSlaProgress,
  selectSlaProgress,
  makeSelectTicketAge,
  selectTicketAge,
  makeSelectIsPullableCard,
  selectIsPullableCard,
};
