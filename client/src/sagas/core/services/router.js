/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put, select, take } from 'redux-saga/effects';
import { push } from '../../../lib/redux-router';

import { logout } from './core';
import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import { getAccessToken } from '../../../utils/access-token-storage';
import mergeRecords from '../../../utils/merge-records';
import ActionTypes from '../../../constants/ActionTypes';
import Paths from '../../../constants/Paths';

export function* goTo(pathname) {
  yield put(push(pathname));
}

export function* goToRoot() {
  yield call(goTo, Paths.ROOT);
}

export function* goToProject(projectId) {
  yield call(goTo, Paths.PROJECTS.replace(':id', projectId));
}

export function* goToBoard(boardId) {
  yield call(goTo, Paths.BOARDS.replace(':id', boardId));
}

export function* goToCard(cardId) {
  yield call(goTo, Paths.CARDS.replace(':id', cardId));
}

export function* handleLocationChange() {
  const accessToken = yield call(getAccessToken);

  if (!accessToken) {
    yield call(logout, false);
    return;
  }

  const pathsMatch = yield select(selectors.selectPathsMatch);

  if (!pathsMatch) {
    yield put(actions.handleLocationChange());
    return;
  }

  switch (pathsMatch.pattern.path) {
    case Paths.LOGIN:
    case Paths.OIDC_CALLBACK:
      yield call(goToRoot);

      break;
    default:
  }

  const isInitializing = yield select(selectors.selectIsInitializing);

  if (isInitializing) {
    yield take(ActionTypes.CORE_INITIALIZE);
  }

  let currentBoard = yield select(selectors.selectCurrentBoard);

  let currentBoardId = null;
  let currentCardId = null;
  let isEditModeEnabled;
  let board;
  let card;
  let users1;
  let users2;
  let projects;
  let boardMemberships;
  let labels;
  let lists;
  let cards;
  let cardMemberships1;
  let cardMemberships2;
  let cardLabels1;
  let cardLabels2;
  let taskLists1;
  let taskLists2;
  let tasks1;
  let tasks2;
  let attachments1;
  let attachments2;
  let customFieldGroups1;
  let customFieldGroups2;
  let customFields1;
  let customFields2;
  let customFieldValues1;
  let customFieldValues2;
  let swimLanes;
  let commitmentPoints;
  let classesOfService;
  let decorators;
  let cardDecorators;
  let blockers;
  let blockerLinkedCards;
  let cardRelationships;
  let notificationsToDelete;

  switch (pathsMatch.pattern.path) {
    case Paths.ROOT:
      isEditModeEnabled = false;

      break;
    case Paths.PROJECTS: {
      const boardIds = yield select(selectors.selectBoardIdsForCurrentProject);

      if (boardIds && boardIds.length === 0) {
        isEditModeEnabled = true;
      }

      break;
    }
    case Paths.BOARDS:
    case Paths.BOARDS_METRICS:
      if (currentBoard) {
        ({ id: currentBoardId } = currentBoard);

        // isFetching이 null(첫 진입)이거나 false(완료된 fetch가 있었음 — 새로고침 등)일 때
        // 항상 다시 fetch한다. true(진행 중)일 때만 건너뛴다.
        if (currentBoard.isFetching !== true) {
          yield put(actions.handleLocationChange.fetchBoard(currentBoard.id));

          try {
            ({
              item: board,
              included: {
                projects,
                boardMemberships,
                labels,
                lists,
                cards,
                users: users1,
                cardMemberships: cardMemberships1,
                cardLabels: cardLabels1,
                taskLists: taskLists1,
                tasks: tasks1,
                attachments: attachments1,
                customFieldGroups: customFieldGroups1,
                customFields: customFields1,
                customFieldValues: customFieldValues1,
                swimLanes,
                commitmentPoints,
                classesOfService,
                decorators,
                cardDecorators,
                blockers,
                blockerLinkedCards,
                cardRelationships,
              },
            } = yield call(request, api.getBoard, currentBoard.id, true));
          } catch {
            /* empty */
          }
        }
      }

      break;
    case Paths.CARDS:
      ({ cardId: currentCardId, boardId: currentBoardId } = yield select(selectors.selectPath));

      if (!currentCardId) {
        yield put(actions.handleLocationChange.fetchContent());

        try {
          ({
            item: card,
            included: {
              users: users1,
              cardMemberships: cardMemberships1,
              cardLabels: cardLabels1,
              taskLists: taskLists1,
              tasks: tasks1,
              attachments: attachments1,
              customFieldGroups: customFieldGroups1,
              customFields: customFields1,
              customFieldValues: customFieldValues1,
            },
          } = yield call(request, api.getCard, pathsMatch.params.id));
        } catch {
          /* empty */
        }

        if (card) {
          ({ id: currentCardId } = card);
          currentBoard = yield select(selectors.selectBoardById, card.boardId);
          if (currentBoard) {
            ({ id: currentBoardId } = currentBoard);
          }
        }
      }

      // 카드 경로에서 직접 새로고침하면 cardId가 이미 store에 있어 위의 if(!currentCardId)
      // 분기를 타지 않는다. 그래서 보드 fetch가 일어나지 않아 blockers 등 새 도메인이
      // store에 적재되지 않는 문제가 있었다. cardId 유무와 무관하게 보드가 아직 안
      // 가져와졌으면(isFetching === null) 한 번 fetch한다.
      if (currentCardId && !currentBoard) {
        currentBoard = yield select(selectors.selectCurrentBoard);
      }
      if (currentBoard && currentBoard.isFetching === null && !board) {
        ({ id: currentBoardId } = currentBoard);
        yield put(actions.handleLocationChange.fetchBoard(currentBoard.id));
        try {
          ({
            item: board,
            included: {
              projects,
              boardMemberships,
              labels,
              lists,
              cards,
              users: users2,
              cardMemberships: cardMemberships2,
              cardLabels: cardLabels2,
              taskLists: taskLists2,
              tasks: tasks2,
              attachments: attachments2,
              customFieldGroups: customFieldGroups2,
              customFields: customFields2,
              customFieldValues: customFieldValues2,
              swimLanes,
              commitmentPoints,
              classesOfService,
              decorators,
              cardDecorators,
              blockers,
              blockerLinkedCards,
              cardRelationships,
            },
          } = yield call(request, api.getBoard, currentBoard.id, true));
        } catch {
          /* empty */
        }
      }

      if (currentCardId) {
        const notificationIds = yield select(
          selectors.selectNotificationIdsByCardId,
          currentCardId,
        );

        if (notificationIds.length > 0) {
          try {
            ({
              included: { notifications: notificationsToDelete },
            } = yield call(request, api.readCardNotifications, currentCardId));
          } catch {
            /* empty */
          }
        }
      }

      break;
    default:
  }

  yield put(
    actions.handleLocationChange(
      pathsMatch.pathname,
      currentBoardId,
      currentCardId,
      isEditModeEnabled,
      board,
      mergeRecords(users1, users2),
      projects,
      boardMemberships,
      labels,
      lists,
      mergeRecords(card && [card], cards),
      mergeRecords(cardMemberships1, cardMemberships2),
      mergeRecords(cardLabels1, cardLabels2),
      mergeRecords(taskLists1, taskLists2),
      mergeRecords(tasks1, tasks2),
      mergeRecords(attachments1, attachments2),
      mergeRecords(customFieldGroups1, customFieldGroups2),
      mergeRecords(customFields1, customFields2),
      mergeRecords(customFieldValues1, customFieldValues2),
      notificationsToDelete,
      swimLanes,
      commitmentPoints,
      classesOfService,
      decorators,
      cardDecorators,
      blockers,
      blockerLinkedCards,
      cardRelationships,
    ),
  );
}

export default {
  goTo,
  goToRoot,
  goToProject,
  goToBoard,
  goToCard,
  handleLocationChange,
};
