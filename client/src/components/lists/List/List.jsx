/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { Button, Icon } from 'semantic-ui-react';
import { useDidUpdate, useToggle, useTransitioning } from '../../../lib/hooks';
import { usePopup } from '../../../lib/popup';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { BoardShortcutsContext } from '../../../contexts';
import DroppableTypes from '../../../constants/DroppableTypes';
import { BoardMembershipRoles, ListTypes } from '../../../constants/Enums';
import { ListTypeIcons } from '../../../constants/Icons';
import EditName from './EditName';
import WipLimitIndicator from '../WipLimitIndicator';
import ActionsStep from './ActionsStep';
import AllClosedCardsModal from './AllClosedCardsModal';
import DraggableCard from '../../cards/DraggableCard';
import AddCard from '../../cards/AddCard';
import ArchiveCardsStep from '../../cards/ArchiveCardsStep';
import PlusMathIcon from '../../../assets/images/plus-math-icon.svg?react';

import styles from './List.module.scss';
import globalStyles from '../../../styles.module.scss';

const AddCardPositions = {
  TOP: 'top',
  BOTTOM: 'bottom',
};

const INDEX_BY_ADD_CARD_POSITION = {
  [AddCardPositions.TOP]: 0,
};

// CLOSED 컬럼에서 보드 본문에 직접 표시할 최대 카드 수 (그 이상은 "전체 보기"로)
const MAX_CLOSED_VISIBLE = 10;

const List = React.memo(
  ({ id, index, swimLaneId, isFirstLane, isDefaultLane, excludeSwimLaneId, isExpediteLane }) => {
    const selectListById = useMemo(() => selectors.makeSelectListById(), []);

    const selectFilteredCardIdsByListId = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListId(),
      [],
    );

    const selectFilteredCardIdsByListAndSwimLane = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListAndSwimLane(),
      [],
    );

    const selectFilteredCardIdsByListExcludingSwimLane = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListExcludingSwimLane(),
      [],
    );

    const selectSubColumnIds = useMemo(() => selectors.makeSelectSubColumnIdsByListId(), []);

    const selectActiveSubColumnCardIds = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListId(),
      [],
    );
    const selectDoneSubColumnCardIds = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListId(),
      [],
    );

    const selectActiveSubCardIdsByLane = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListAndSwimLane(),
      [],
    );
    const selectDoneSubCardIdsByLane = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListAndSwimLane(),
      [],
    );

    const selectActiveSubCardIdsExcl = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListExcludingSwimLane(),
      [],
    );
    const selectDoneSubCardIdsExcl = useMemo(
      () => selectors.makeSelectFilteredCardIdsByListExcludingSwimLane(),
      [],
    );

    const clipboard = useSelector(selectors.selectClipboard);
    const isFavoritesActive = useSelector(selectors.selectIsFavoritesActiveForCurrentUser);

    const isLaneScoped = swimLaneId !== undefined;
    const isExcluding = excludeSwimLaneId !== undefined;

    const list = useSelector((state) => selectListById(state, id));
    const cardIds = useSelector((state) => {
      if (isLaneScoped) {
        return selectFilteredCardIdsByListAndSwimLane(state, id, swimLaneId, !!isDefaultLane);
      }
      if (isExcluding) {
        return selectFilteredCardIdsByListExcludingSwimLane(state, id, excludeSwimLaneId);
      }
      return selectFilteredCardIdsByListId(state, id);
    });
    const subColumnIds = useSelector((state) => selectSubColumnIds(state, id));
    const hasSubColumns = !!(subColumnIds && subColumnIds.length > 0);
    const activeSubColumnId = hasSubColumns ? subColumnIds[0] : null;
    const doneSubColumnId = hasSubColumns ? subColumnIds[1] : null;
    const activeSubCardIds = useSelector((state) => {
      if (!activeSubColumnId) return null;
      if (isLaneScoped) {
        return selectActiveSubCardIdsByLane(state, activeSubColumnId, swimLaneId, !!isDefaultLane);
      }
      if (isExcluding) {
        return selectActiveSubCardIdsExcl(state, activeSubColumnId, excludeSwimLaneId);
      }
      return selectActiveSubColumnCardIds(state, activeSubColumnId);
    });
    const doneSubCardIds = useSelector((state) => {
      if (!doneSubColumnId) return null;
      if (isLaneScoped) {
        return selectDoneSubCardIdsByLane(state, doneSubColumnId, swimLaneId, !!isDefaultLane);
      }
      if (isExcluding) {
        return selectDoneSubCardIdsExcl(state, doneSubColumnId, excludeSwimLaneId);
      }
      return selectDoneSubColumnCardIds(state, doneSubColumnId);
    });

    const { canEdit, canArchiveCards, canAddCard, canPasteCard, canDropCard } = useSelector(
      (state) => {
        const isEditModeEnabled = selectors.selectIsEditModeEnabled(state); // TODO: move out?

        const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
        const isEditor = !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;

        return {
          canEdit: isEditModeEnabled && isEditor,
          canArchiveCards: list.type === ListTypes.CLOSED && isEditor,
          canAddCard: isEditor,
          canPasteCard: isEditor,
          canDropCard: isEditor,
        };
      },
      shallowEqual,
    );

    const dispatch = useDispatch();
    const [t] = useTranslation();
    const [isEditNameOpened, setIsEditNameOpened] = useState(false);
    const [addCardPosition, setAddCardPosition] = useState(null);

    // CLOSED 컬럼은 접기/펴기 가능 (localStorage에 보드별로 저장)
    const isClosedList = list && list.type === ListTypes.CLOSED;
    const collapseStorageKey = isClosedList ? `closedListCollapsed:${id}` : null;
    const [isCollapsed, setIsCollapsed] = useState(() => {
      if (!collapseStorageKey) return false;
      try {
        return window.localStorage.getItem(collapseStorageKey) === '1';
      } catch (e) {
        return false;
      }
    });
    const handleToggleCollapse = useCallback(
      (event) => {
        event.stopPropagation();
        setIsCollapsed((prev) => {
          const next = !prev;
          try {
            if (collapseStorageKey) {
              window.localStorage.setItem(collapseStorageKey, next ? '1' : '0');
            }
          } catch (e) {
            // localStorage 실패는 치명적이지 않다
          }
          return next;
        });
      },
      [collapseStorageKey],
    );
    const [isAllClosedCardsOpen, setIsAllClosedCardsOpen] = useState(false);
    const handleOpenAllClosedCards = useCallback((event) => {
      event.stopPropagation();
      setIsAllClosedCardsOpen(true);
    }, []);
    const handleCloseAllClosedCards = useCallback(() => {
      setIsAllClosedCardsOpen(false);
    }, []);
    const [scrollBottomState, scrollBottom] = useToggle();
    const [handleListMouseEnter, handleListMouseLeave] = useContext(BoardShortcutsContext);

    const wrapperRef = useRef(null);
    const cardsWrapperRef = useRef(null);

    const handleCardCreate = useCallback(
      (data, autoOpen) => {
        const payload = isLaneScoped && swimLaneId ? { ...data, swimLaneId } : data;
        dispatch(
          entryActions.createCard(
            id,
            payload,
            INDEX_BY_ADD_CARD_POSITION[addCardPosition],
            autoOpen,
          ),
        );
      },
      [id, dispatch, addCardPosition, isLaneScoped, swimLaneId],
    );

    const handlePasteCardClick = useCallback(() => {
      dispatch(entryActions.pasteCard(id));
      scrollBottom();
    }, [id, dispatch, scrollBottom]);

    const handleMouseEnter = useCallback(() => {
      handleListMouseEnter(id, () => {
        scrollBottom();
      });
    }, [id, scrollBottom, handleListMouseEnter]);

    const handleHeaderClick = useCallback(() => {
      if (list.isPersisted && canEdit) {
        setIsEditNameOpened(true);
      }
    }, [list.isPersisted, canEdit]);

    const handleAddCardClick = useCallback(() => {
      setAddCardPosition(AddCardPositions.BOTTOM);
    }, []);

    const handleAddCardClose = useCallback(() => {
      setAddCardPosition(null);
    }, []);

    const handleCardAdd = useCallback(() => {
      setAddCardPosition(AddCardPositions.TOP);
    }, []);

    const handleNameEdit = useCallback(() => {
      setIsEditNameOpened(true);
    }, []);

    const handleEditNameClose = useCallback(() => {
      setIsEditNameOpened(false);
    }, []);

    const handleWrapperTransitionEnd = useTransitioning(
      wrapperRef,
      styles.outerWrapperTransitioning,
      [isFavoritesActive],
    );

    useDidUpdate(() => {
      if (!addCardPosition) {
        return;
      }

      cardsWrapperRef.current.scrollTop =
        addCardPosition === AddCardPositions.TOP ? 0 : cardsWrapperRef.current.scrollHeight;
    }, [cardIds, addCardPosition]);

    useDidUpdate(() => {
      cardsWrapperRef.current.scrollTop = cardsWrapperRef.current.scrollHeight;
    }, [scrollBottomState]);

    const ActionsPopup = usePopup(ActionsStep);
    const ArchiveCardsPopup = usePopup(ArchiveCardsStep);

    const addCardNode = canAddCard && (
      <AddCard
        isOpened={!!addCardPosition}
        className={styles.addCard}
        onCreate={handleCardCreate}
        onClose={handleAddCardClose}
      />
    );

    const laneSuffix = isLaneScoped ? `:lane:${swimLaneId || ''}` : '';

    const renderDroppableCards = (droppableId, ids, withAddCardTop, withAddCardBottom) => (
      <Droppable
        droppableId={droppableId}
        type={DroppableTypes.CARD}
        isDropDisabled={!list.isPersisted || !canDropCard}
      >
        {({ innerRef, droppableProps, placeholder }) => (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <div {...droppableProps} ref={innerRef}>
            <div className={styles.cards}>
              {withAddCardTop && addCardNode}
              {(ids || []).map((cardId, cardIndex) => (
                <DraggableCard key={cardId} id={cardId} index={cardIndex} className={styles.card} />
              ))}
              {placeholder}
              {withAddCardBottom && addCardNode}
            </div>
          </div>
        )}
      </Droppable>
    );

    // CLOSED 컬럼은 최대 N개까지만 본문에 표시. 나머지는 "전체 보기" 모달로.
    const visibleClosedCardIds =
      isClosedList && cardIds && cardIds.length > MAX_CLOSED_VISIBLE
        ? cardIds.slice(0, MAX_CLOSED_VISIBLE)
        : cardIds;
    const closedHiddenCount =
      isClosedList && cardIds ? Math.max(0, cardIds.length - MAX_CLOSED_VISIBLE) : 0;

    const cardsNode = hasSubColumns ? (
      <div className={styles.subColumns}>
        <div className={styles.subColumn}>
          <div className={styles.subColumnHeader}>
            {t('common.active', { defaultValue: 'Active' })}
            {activeSubCardIds && (
              <span className={styles.subColumnCount}>{activeSubCardIds.length}</span>
            )}
          </div>
          {renderDroppableCards(
            `list:${activeSubColumnId}${laneSuffix}`,
            activeSubCardIds,
            addCardPosition === AddCardPositions.TOP,
            addCardPosition === AddCardPositions.BOTTOM,
          )}
        </div>
        <div className={styles.subColumn}>
          <div className={classNames(styles.subColumnHeader, styles.subColumnHeaderDone)}>
            {t('common.done', { defaultValue: 'Done' })}
            {doneSubCardIds && (
              <span className={styles.subColumnCount}>{doneSubCardIds.length}</span>
            )}
          </div>
          {renderDroppableCards(
            `list:${doneSubColumnId}${laneSuffix}`,
            doneSubCardIds,
            false,
            false,
          )}
        </div>
      </div>
    ) : (
      renderDroppableCards(
        `list:${id}${laneSuffix}`,
        isClosedList ? visibleClosedCardIds : cardIds,
        addCardPosition === AddCardPositions.TOP,
        addCardPosition === AddCardPositions.BOTTOM,
      )
    );

    const showHeader = !isLaneScoped || isFirstLane;

    const isDragDisabled = !list.isPersisted || !canEdit || isEditNameOpened || isLaneScoped;

    return (
      <Draggable
        draggableId={`list:${id}${laneSuffix}`}
        index={index}
        isDragDisabled={isDragDisabled}
      >
        {({ innerRef, draggableProps, dragHandleProps }) => (
          <div
            {...draggableProps} // eslint-disable-line react/jsx-props-no-spreading
            data-drag-scroller
            ref={innerRef}
            className={classNames(
              styles.innerWrapper,
              hasSubColumns && styles.innerWrapperWithSubColumns,
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleListMouseLeave}
          >
            <div
              ref={wrapperRef}
              className={classNames(
                styles.outerWrapper,
                isFavoritesActive && styles.outerWrapperWithFavorites,
                list.color && globalStyles[`background${upperFirst(camelCase(list.color))}Soft`],
                list.type === ListTypes.BACKLOG && styles.outerWrapperBacklog,
                list.type === ListTypes.CLOSED && styles.outerWrapperClosed,
                list.type === ListTypes.DISCARD && styles.outerWrapperDiscard,
                isClosedList && isCollapsed && styles.outerWrapperCollapsed,
              )}
              onTransitionEnd={handleWrapperTransitionEnd}
            >
              {showHeader && (
                /* eslint-disable-next-line jsx-a11y/click-events-have-key-events,
                                         jsx-a11y/no-static-element-interactions */
                <div
                  {...dragHandleProps} // eslint-disable-line react/jsx-props-no-spreading
                  className={classNames(styles.header, canEdit && styles.headerEditable)}
                  onClick={handleHeaderClick}
                >
                  {isEditNameOpened ? (
                    <EditName listId={id} onClose={handleEditNameClose} />
                  ) : (
                    <div className={styles.headerName}>
                      {list.color && (
                        <Icon
                          name="circle"
                          className={classNames(
                            styles.headerNameColor,
                            globalStyles[`color${upperFirst(camelCase(list.color))}`],
                          )}
                        />
                      )}
                      {list.name}
                    </div>
                  )}
                  {list.type !== ListTypes.TASK && (
                    <Icon
                      name={ListTypeIcons[list.type]}
                      className={classNames(
                        styles.headerIcon,
                        list.isPersisted &&
                          (canEdit || canArchiveCards) &&
                          styles.headerIconHidable,
                      )}
                    />
                  )}
                  {list.isPersisted && list.type === ListTypes.TASK && !isExpediteLane && (
                    <span className={styles.headerWipLimit}>
                      <WipLimitIndicator listId={id} />
                    </span>
                  )}
                  {isClosedList && (
                    <span className={styles.headerClosedCount}>{(cardIds || []).length}</span>
                  )}
                  {isClosedList && (
                    <Button
                      className={styles.headerCollapseButton}
                      onClick={handleToggleCollapse}
                      title={isCollapsed ? t('action.expand') : t('action.collapse')}
                    >
                      <Icon fitted size="small" name={isCollapsed ? 'angle down' : 'angle up'} />
                    </Button>
                  )}
                  {list.isPersisted &&
                    (canEdit ? (
                      <ActionsPopup
                        listId={id}
                        onNameEdit={handleNameEdit}
                        onCardAdd={handleCardAdd}
                      >
                        <Button className={styles.headerButton}>
                          <Icon fitted name="pencil" size="small" />
                        </Button>
                      </ActionsPopup>
                    ) : (
                      canArchiveCards && (
                        <ArchiveCardsPopup listId={id}>
                          <Button className={styles.headerButton}>
                            <Icon fitted name="archive" size="small" />
                          </Button>
                        </ArchiveCardsPopup>
                      )
                    ))}
                </div>
              )}
              <div ref={cardsWrapperRef} className={styles.cardsInnerWrapper}>
                <div className={styles.cardsOuterWrapper}>{cardsNode}</div>
              </div>
              {isClosedList && closedHiddenCount > 0 && (
                <button
                  type="button"
                  className={styles.viewAllClosedButton}
                  onClick={handleOpenAllClosedCards}
                >
                  {t('action.viewAllCompletedCards', {
                    defaultValue: '완료된 카드 전체 보기',
                  })}
                  <span className={styles.viewAllClosedHint}>+{closedHiddenCount}</span>
                </button>
              )}
              {isClosedList && isAllClosedCardsOpen && (
                <AllClosedCardsModal
                  listName={list.name}
                  cardIds={cardIds || []}
                  onClose={handleCloseAllClosedCards}
                />
              )}
              {!addCardPosition && canAddCard && (
                <div className={styles.addCardButtonWrapper}>
                  <button
                    type="button"
                    disabled={!list.isPersisted}
                    className={classNames(
                      styles.addCardButton,
                      list.color &&
                        globalStyles[`background${upperFirst(camelCase(list.color))}Soft`],
                    )}
                    onClick={handleAddCardClick}
                  >
                    <PlusMathIcon className={styles.addCardButtonIcon} />
                    <span className={styles.addCardButtonText}>
                      {cardIds.length > 0 ? t('action.addAnotherCard') : t('action.addCard')}
                    </span>
                  </button>
                  {clipboard && canPasteCard && (
                    <button
                      type="button"
                      disabled={!list.isPersisted}
                      className={classNames(styles.addCardButton, styles.paste)}
                      onClick={handlePasteCardClick}
                    >
                      <Icon name="paste" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  },
);

List.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  swimLaneId: PropTypes.string,
  isFirstLane: PropTypes.bool,
  isDefaultLane: PropTypes.bool,
  excludeSwimLaneId: PropTypes.string,
  isExpediteLane: PropTypes.bool,
};

List.defaultProps = {
  swimLaneId: undefined,
  isFirstLane: false,
  isDefaultLane: false,
  excludeSwimLaneId: undefined,
  isExpediteLane: false,
};

export default List;
