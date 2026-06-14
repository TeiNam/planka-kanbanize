/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { selectPath } from './router';
import { selectCurrentUserId } from './users';
import { isLocalId } from '../utils/local-id';
import { ListTypes } from '../constants/Enums';

// 카드가 속한 리스트의 실효 타입을 반환한다. 서브컬럼이면 부모 리스트의 타입을 사용한다.
const getEffectiveListType = (cardModel) => {
  const listModel = cardModel.list;

  if (!listModel) {
    return null;
  }

  if (listModel.parentListId) {
    return listModel.parentList ? listModel.parentList.type : null;
  }

  return listModel.type;
};

export const makeSelectProjectById = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Project }, id) => {
      const projectModel = Project.withId(id);

      if (!projectModel) {
        return projectModel;
      }

      return projectModel.ref;
    },
  );

export const selectProjectById = makeSelectProjectById();

export const makeSelectBoardIdsByProjectId = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Project, User }, id, currentUserId) => {
      if (!id) {
        return id;
      }

      const projectModel = Project.withId(id);

      if (!projectModel) {
        return projectModel;
      }

      const currentUserModel = User.withId(currentUserId);

      return projectModel
        .getBoardsModelArrayAvailableForUser(currentUserModel)
        .map((boardModel) => boardModel.id);
    },
  );

export const selectBoardIdsByProjectId = makeSelectBoardIdsByProjectId();

export const makeSelectFirstBoardIdByProjectId = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Project, User }, id, currentUserId) => {
      const projectModel = Project.withId(id);

      if (!projectModel) {
        return projectModel;
      }

      const currentUserModel = User.withId(currentUserId);
      const boardsModels = projectModel.getBoardsModelArrayAvailableForUser(currentUserModel);

      return boardsModels[0] && boardsModels[0].id;
    },
  );

export const selectFirstBoardIdByProjectId = makeSelectFirstBoardIdByProjectId();

export const makeSelectNotificationsTotalByProjectId = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Project, User }, id, currentUserId) => {
      const projectModel = Project.withId(id);

      if (!projectModel) {
        return projectModel;
      }

      const currentUserModel = User.withId(currentUserId);
      const boardsModels = projectModel.getBoardsModelArrayAvailableForUser(currentUserModel);

      return boardsModels.reduce(
        (result, boardModel) => result + boardModel.getUnreadNotificationsQuerySet().count(),
        0,
      );
    },
  );

export const selectNotificationsTotalByProjectId = makeSelectNotificationsTotalByProjectId();

export const makeSelectIsProjectWithIdAvailableForCurrentUser = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Project, User }, id, currentUserId) => {
      const projectModel = Project.withId(id);

      if (!projectModel) {
        return false;
      }

      const currentUserModel = User.withId(currentUserId);
      return projectModel.isAvailableForUser(currentUserModel);
    },
  );

export const selectIsProjectWithIdAvailableForCurrentUser =
  makeSelectIsProjectWithIdAvailableForCurrentUser();

export const makeSelectIsProjectWithIdExternalAccessibleForCurrentUser = () =>
  createSelector(
    orm,
    (_, id) => id,
    (state) => selectCurrentUserId(state),
    ({ Project, User }, id, currentUserId) => {
      const projectModel = Project.withId(id);

      if (!projectModel) {
        return false;
      }

      const currentUserModel = User.withId(currentUserId);
      return projectModel.isExternalAccessibleForUser(currentUserModel);
    },
  );

export const selectIsProjectWithIdExternalAccessibleForCurrentUser =
  makeSelectIsProjectWithIdExternalAccessibleForCurrentUser();

export const selectCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  ({ Project }, id) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    return projectModel.ref;
  },
);

export const selectManagersForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  ({ Project }, id) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    return projectModel
      .getManagersQuerySet()
      .toModelArray()
      .map((projectManagerModel) => ({
        ...projectManagerModel.ref,
        isPersisted: !isLocalId(projectManagerModel.id),
        user: projectManagerModel.user.ref,
      }));
  },
);

export const selectManagerUserIdsForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  ({ Project }, id) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    return projectModel
      .getManagersQuerySet()
      .toRefArray()
      .map((projectManager) => projectManager.userId);
  },
);

export const selectBackgroundImageIdsForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  ({ Project }, id) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    return projectModel
      .getBackgroundImagesQuerySet()
      .toRefArray()
      .map((backgroundImage) => backgroundImage.id);
  },
);

export const selectBaseCustomFieldGroupIdsForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  ({ Project }, id) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    return projectModel
      .getBaseCustomFieldGroupsQuerySet()
      .toRefArray()
      .map((baseCustomFieldGroup) => baseCustomFieldGroup.id);
  },
);

export const selectBaseCustomFieldGroupsForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  ({ Project }, id) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    return projectModel
      .getBaseCustomFieldGroupsQuerySet()
      .toRefArray()
      .map((baseCustomFieldGroup) => ({
        ...baseCustomFieldGroup,
        isPersisted: !isLocalId(baseCustomFieldGroup.id),
      }));
  },
);

export const selectBoardIdsForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  (state) => selectCurrentUserId(state),
  ({ Project, User }, id, currentUserId) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    const currentUserModel = User.withId(currentUserId);

    return projectModel
      .getBoardsModelArrayAvailableForUser(currentUserModel)
      .map((boardModel) => boardModel.id);
  },
);

export const selectIsCurrentUserManagerForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  (state) => selectCurrentUserId(state),
  ({ Project }, id, currentUserId) => {
    if (!id) {
      return false;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return false;
    }

    return projectModel.hasManagerWithUserId(currentUserId);
  },
);

// 캘린더 마감일 표시용 — 현재 프로젝트의 (현재 사용자가 접근 가능한) 모든 보드 카드 중
// "task" 리스트(ListTypes.TASK)에 속하고 dueDate가 설정된 카드만 파생 수집한다.
// 백로그/closed(done)/discard/archive/trash 리스트의 카드는 제외한다.
// 스냅샷을 보관하지 않고 매번 현재 카드에서 재평가되므로, 카드의 dueDate 또는 소속 리스트가
// 바뀌면 셀렉터 재실행으로 즉시 반영된다 (R8.6, R8.7 / Correctness Property 4).
export const selectDueDateCardsForCurrentProject = createSelector(
  orm,
  (state) => selectPath(state).projectId,
  (state) => selectCurrentUserId(state),
  ({ Project, User }, id, currentUserId) => {
    if (!id) {
      return id;
    }

    const projectModel = Project.withId(id);

    if (!projectModel) {
      return projectModel;
    }

    const currentUserModel = User.withId(currentUserId);
    const boardModels = projectModel.getBoardsModelArrayAvailableForUser(currentUserModel);

    return boardModels
      .flatMap((boardModel) => boardModel.getCardsModelArray())
      .filter(
        (cardModel) =>
          getEffectiveListType(cardModel) === ListTypes.TASK &&
          cardModel.dueDate !== null &&
          cardModel.dueDate !== undefined,
      )
      .map((cardModel) => ({
        id: cardModel.id,
        name: cardModel.name,
        dueDate: cardModel.dueDate,
      }));
  },
);

export default {
  makeSelectProjectById,
  selectProjectById,
  makeSelectBoardIdsByProjectId,
  selectBoardIdsByProjectId,
  makeSelectFirstBoardIdByProjectId,
  selectFirstBoardIdByProjectId,
  makeSelectNotificationsTotalByProjectId,
  selectNotificationsTotalByProjectId,
  makeSelectIsProjectWithIdAvailableForCurrentUser,
  selectIsProjectWithIdAvailableForCurrentUser,
  makeSelectIsProjectWithIdExternalAccessibleForCurrentUser,
  selectIsProjectWithIdExternalAccessibleForCurrentUser,
  selectCurrentProject,
  selectManagersForCurrentProject,
  selectManagerUserIdsForCurrentProject,
  selectBackgroundImageIdsForCurrentProject,
  selectBaseCustomFieldGroupIdsForCurrentProject,
  selectBaseCustomFieldGroupsForCurrentProject,
  selectBoardIdsForCurrentProject,
  selectIsCurrentUserManagerForCurrentProject,
  selectDueDateCardsForCurrentProject,
};
