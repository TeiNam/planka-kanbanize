/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Loader } from 'semantic-ui-react';

import selectors from '../../../selectors';
import ModalTypes from '../../../constants/ModalTypes';
import { BoardContexts, BoardViews } from '../../../constants/Enums';
import KanbanContent from './KanbanContent';
import FiniteContent from './FiniteContent';
import EndlessContent from './EndlessContent';
import ShortcutsProvider from './ShortcutsProvider';
import CardModal from '../../cards/CardModal';
import BoardActivitiesModal from '../../activities/BoardActivitiesModal';

const MetricsDashboard = lazy(() => import('../../metrics/MetricsDashboard'));

const Board = React.memo(() => {
  const board = useSelector(selectors.selectCurrentBoard);
  const modal = useSelector(selectors.selectCurrentModal);
  const isCardModalOpened = useSelector((state) => !!selectors.selectPath(state).cardId);
  const isMetricsRoute = useSelector((state) => !!selectors.selectPath(state).isMetricsView);

  // 메트릭 뷰: 뷰 전환 버튼 또는 URL 경로로 접근 가능
  const isMetricsView = board.view === BoardViews.METRICS || isMetricsRoute;

  let Content;
  if (!isMetricsView) {
    if (board.view === BoardViews.KANBAN) {
      Content = KanbanContent;
    } else {
      switch (board.context) {
        case BoardContexts.BOARD:
          Content = FiniteContent;

          break;
        case BoardContexts.ARCHIVE:
        case BoardContexts.TRASH:
          Content = EndlessContent;

          break;
        default:
      }
    }
  }

  let modalNode = null;
  if (isCardModalOpened) {
    modalNode = <CardModal />;
  } else if (modal) {
    switch (modal.type) {
      case ModalTypes.BOARD_ACTIVITIES:
        modalNode = <BoardActivitiesModal />;

        break;
      default:
    }
  }

  return (
    <>
      {isMetricsView ? (
        <Suspense fallback={<Loader active inline="centered" />}>
          <MetricsDashboard boardId={board.id} />
        </Suspense>
      ) : (
        <ShortcutsProvider>
          <Content />
        </ShortcutsProvider>
      )}
      {modalNode}
    </>
  );
});

export default Board;
