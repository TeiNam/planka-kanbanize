/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useDidUpdate } from '../../../../lib/hooks';
import { closePopup } from '../../../../lib/popup';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import parseDndId from '../../../../utils/parse-dnd-id';
import DroppableTypes from '../../../../constants/DroppableTypes';
import { BoardMembershipRoles, ListTypes } from '../../../../constants/Enums';
import AddList from './AddList';
import List from '../../../lists/List';
import BoardSummaryBar from '../BoardSummaryBar';
import SwimLaneRail from '../../../swim-lanes/SwimLaneRail';
import AddSwimLaneButton from '../../../swim-lanes/AddSwimLaneButton';
import PlusMathIcon from '../../../../assets/images/plus-math-icon.svg?react';

import styles from './KanbanContent.module.scss';
import globalStyles from '../../../../styles.module.scss';

const KanbanContent = React.memo(() => {
  const listIds = useSelector(selectors.selectKanbanListIdsForCurrentBoard);
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);

  const board = useSelector(selectors.selectCurrentBoard);
  const isSwimLanesEnabled = !!board && board.isSwimLanesEnabled;
  const isExpediteLaneEnabled = !!board && board.isExpediteLaneEnabled;
  const expediteWipLimit = (board && board.expediteWipLimit) || 1;

  const swimLanes = useSelector((state) => {
    if (!board) return [];
    return selectors.selectSwimLanesByBoardId(state, board.id) || [];
  });

  // 표준 레인 (스윔레인 모드일 때만 사용)
  const standardLanes = useMemo(
    () =>
      swimLanes
        .filter((l) => l.type !== 'expedite')
        .slice()
        .sort((a, b) => a.position - b.position),
    [swimLanes],
  );

  // Expedite 레인 (긴급 토글일 때만 사용)
  const expediteLane = useMemo(
    () => swimLanes.find((l) => l.type === 'expedite') || null,
    [swimLanes],
  );

  const showExpediteRow = isExpediteLaneEnabled && !!expediteLane;
  const showStandardLanes = isSwimLanesEnabled && standardLanes.length > 0;

  // backlog 컬럼의 인덱스만 단일 숫자로 추출 (배열을 만들지 않아 referential equality 안전)
  const backlogIndex = useSelector((state) => {
    if (!listIds) return -1;
    for (let i = 0; i < listIds.length; i += 1) {
      const list = selectListById(state, listIds[i]);
      if (list && list.type === ListTypes.BACKLOG) return i;
    }
    return -1;
  });

  const canAddList = useSelector((state) => {
    const isEditModeEnabled = selectors.selectIsEditModeEnabled(state); // TODO: move out?

    if (!isEditModeEnabled) {
      return isEditModeEnabled;
    }

    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isAddListOpened, setIsAddListOpened] = useState(false);

  const wrapperRef = useRef(null);
  const prevPositionRef = useRef(null);

  const handleDragStart = useCallback(() => {
    document.body.classList.add(globalStyles.dragging);
    closePopup();
  }, []);

  const handleDragEnd = useCallback(
    ({ draggableId, type, source, destination }) => {
      document.body.classList.remove(globalStyles.dragging);

      if (!destination) {
        return;
      }

      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const id = parseDndId(draggableId);

      switch (type) {
        case DroppableTypes.LIST: {
          // backlog 위치 보호:
          // 1) backlog 자체는 항상 가장 왼쪽이어야 한다 (다른 인덱스로 이동 불가)
          // 2) 다른 리스트는 backlog의 왼쪽으로 이동할 수 없다
          const isMovingBacklog = source.index === backlogIndex;
          if (isMovingBacklog && destination.index !== 0) {
            return;
          }
          if (!isMovingBacklog && backlogIndex !== -1 && destination.index <= backlogIndex) {
            return;
          }
          dispatch(entryActions.moveList(id, destination.index));

          break;
        }
        case DroppableTypes.CARD: {
          // droppableId 형식: "list:{listId}" 또는 "list:{listId}:lane:{laneId}"
          const parts = destination.droppableId.split(':');
          const destListId = parts[1];
          const destSwimLaneId = parts[2] === 'lane' ? parts[3] || null : undefined;
          dispatch(entryActions.moveCard(id, destListId, destination.index, destSwimLaneId));

          break;
        }
        default:
      }
    },
    [dispatch, backlogIndex],
  );

  const handleAddListClick = useCallback(() => {
    setIsAddListOpened(true);
  }, []);

  const handleAddListClose = useCallback(() => {
    setIsAddListOpened(false);
  }, []);

  const handleMouseDown = useCallback((event) => {
    // If button is defined and not equal to 0 (left click)
    if (event.button) {
      return;
    }

    if (event.target !== wrapperRef.current && !event.target.dataset.dragScroller) {
      return;
    }

    prevPositionRef.current = event.clientX;

    window.getSelection().removeAllRanges();
    document.body.classList.add(globalStyles.dragScrolling);
  }, []);

  const handleWindowMouseMove = useCallback((event) => {
    if (prevPositionRef.current === null) {
      return;
    }

    event.preventDefault();

    window.scrollBy({
      left: prevPositionRef.current - event.clientX,
    });

    prevPositionRef.current = event.clientX;
  }, []);

  const handleWindowMouseRelease = useCallback(() => {
    if (prevPositionRef.current === null) {
      return;
    }

    prevPositionRef.current = null;
    document.body.classList.remove(globalStyles.dragScrolling);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleWindowMouseMove);

    window.addEventListener('mouseup', handleWindowMouseRelease);
    window.addEventListener('blur', handleWindowMouseRelease);
    window.addEventListener('contextmenu', handleWindowMouseRelease);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);

      window.removeEventListener('mouseup', handleWindowMouseRelease);
      window.removeEventListener('blur', handleWindowMouseRelease);
      window.removeEventListener('contextmenu', handleWindowMouseRelease);
    };
  }, [handleWindowMouseMove, handleWindowMouseRelease]);

  useDidUpdate(() => {
    if (isAddListOpened) {
      window.scroll(document.body.scrollWidth, 0);
    }
  }, [listIds, isAddListOpened]);

  // Expedite 레인 행: 보드 전체 컬럼을 공유하되 expedite 카드만 표시
  const renderExpediteRow = () => {
    if (!expediteLane) return null;
    return (
      <div className={classNames(styles.swimLaneRow, styles.swimLaneRowExpedite)}>
        <div className={styles.swimLaneLabel}>
          <div className={styles.swimLaneLabelInner}>
            <div className={styles.swimLaneLabelName}>
              {t('common.expediteLane', { defaultValue: 'Expedite' })}
            </div>
            <div className={styles.swimLaneLabelWip}>
              {t('common.wipLimit', { defaultValue: 'WIP' })} {expediteWipLimit}
            </div>
          </div>
        </div>
        <div className={styles.swimLaneListsWrapper}>
          <Droppable
            droppableId={`board:lane:${expediteLane.id}`}
            type={DroppableTypes.LIST}
            direction="horizontal"
            isDropDisabled
          >
            {({ innerRef, droppableProps, placeholder }) => (
              <div
                {...droppableProps} // eslint-disable-line react/jsx-props-no-spreading
                ref={innerRef}
                className={styles.lists}
              >
                {listIds.map((listId, index) => (
                  <List
                    key={listId}
                    id={listId}
                    index={index}
                    swimLaneId={expediteLane.id}
                    isFirstLane
                    isExpediteLane
                  />
                ))}
                {placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    );
  };

  // 표준 스윔레인 행들
  const renderStandardLaneRows = () => {
    const firstStandardId = standardLanes[0] && standardLanes[0].id;
    return standardLanes.map((lane, laneIdx) => {
      // Expedite 행이 같은 컬럼들을 공유하며 위에 그려지면 거기서 헤더가 그려지므로,
      // standard 첫 번째 행은 isFirstLane=false 로 두어 헤더가 중복되지 않게 한다.
      const isFirstLane = laneIdx === 0 && !showExpediteRow;
      const isDefaultLane = lane.id === firstStandardId;
      // 컬럼 추가 버튼은 가장 첫 standard 레인 한 번만 노출 (expedite는 자체 컬럼이 없음)
      const showAddListButton = laneIdx === 0;
      return (
        <div key={lane.id} className={styles.swimLaneRow}>
          <div className={styles.swimLaneLabel}>
            <div className={styles.swimLaneLabelInner}>
              <div className={styles.swimLaneLabelName}>{lane.name}</div>
              {lane.wipLimit !== null && lane.wipLimit !== undefined && (
                <div className={styles.swimLaneLabelWip}>
                  {t('common.wipLimit', { defaultValue: 'WIP' })} {lane.wipLimit}
                </div>
              )}
            </div>
          </div>
          <div className={styles.swimLaneListsWrapper}>
            <Droppable
              droppableId={`board:lane:${lane.id}`}
              type={DroppableTypes.LIST}
              direction="horizontal"
              isDropDisabled
            >
              {({ innerRef, droppableProps, placeholder }) => (
                <div
                  {...droppableProps} // eslint-disable-line react/jsx-props-no-spreading
                  ref={innerRef}
                  className={styles.lists}
                >
                  {listIds.map((listId, index) => (
                    <List
                      key={listId}
                      id={listId}
                      index={index}
                      swimLaneId={lane.id}
                      isFirstLane={isFirstLane}
                      isDefaultLane={isDefaultLane}
                    />
                  ))}
                  {placeholder}
                  {showAddListButton && canAddList && (
                    <div data-drag-scroller className={styles.list}>
                      {isAddListOpened ? (
                        <AddList onClose={handleAddListClose} />
                      ) : (
                        <button
                          type="button"
                          className={styles.addListButton}
                          onClick={handleAddListClick}
                        >
                          <PlusMathIcon className={styles.addListButtonIcon} />
                          <span className={styles.addListButtonText}>
                            {listIds.length > 0 ? t('action.addAnotherList') : t('action.addList')}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      );
    });
  };

  // 일반 보드 (스윔레인 OFF). Expedite 토글 ON일 때는 Expedite 카드를 제외한다.
  const renderMainBoard = () => (
    <Droppable droppableId="board" type={DroppableTypes.LIST} direction="horizontal">
      {({ innerRef, droppableProps, placeholder }) => (
        <div
          {...droppableProps} // eslint-disable-line react/jsx-props-no-spreading
          data-drag-scroller
          ref={innerRef}
          className={styles.lists}
        >
          {listIds.map((listId, index) => (
            <List
              key={listId}
              id={listId}
              index={index}
              excludeSwimLaneId={showExpediteRow ? expediteLane.id : undefined}
            />
          ))}
          {placeholder}
          {canAddList && (
            <div data-drag-scroller className={styles.list}>
              {isAddListOpened ? (
                <AddList onClose={handleAddListClose} />
              ) : (
                <button type="button" className={styles.addListButton} onClick={handleAddListClick}>
                  <PlusMathIcon className={styles.addListButtonIcon} />
                  <span className={styles.addListButtonText}>
                    {listIds.length > 0 ? t('action.addAnotherList') : t('action.addList')}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Droppable>
  );

  // 표준 스윔레인 OFF 상태에서 추가 버튼 표시 X. 켜져 있고 레인이 없으면 안내용 레일.
  const showSwimLaneRail = isSwimLanesEnabled && standardLanes.length === 0;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div ref={wrapperRef} className={styles.wrapper} onMouseDown={handleMouseDown}>
      <BoardSummaryBar />
      {showSwimLaneRail && <SwimLaneRail />}
      <div>
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.swimLanes}>
            {showExpediteRow && renderExpediteRow()}
            {showStandardLanes ? renderStandardLaneRows() : null}
            {!showStandardLanes && renderMainBoard()}
            {isSwimLanesEnabled && (
              <div className={styles.swimLaneAddRow}>
                <AddSwimLaneButton />
              </div>
            )}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
});

export default KanbanContent;
