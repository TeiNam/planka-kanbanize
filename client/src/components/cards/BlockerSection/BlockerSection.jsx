/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Icon, Input } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';
import { push } from '../../../lib/redux-router';

import styles from './BlockerSection.module.scss';

// 블로커 사유 최대 길이
const MAX_REASON_LENGTH = 200;

const LinkedCardItem = React.memo(({ linkedCardData, canEdit }) => {
  const dispatch = useDispatch();

  const { card } = linkedCardData;

  const handleCardClick = useCallback(() => {
    if (card) {
      dispatch(push(Paths.CARDS.replace(':id', card.id)));
    }
  }, [card, dispatch]);

  const handleRemoveClick = useCallback(() => {
    dispatch(entryActions.deleteBlockerLinkedCard(linkedCardData.id));
  }, [linkedCardData.id, dispatch]);

  if (!card) {
    return null;
  }

  const isCompleted = !!card.completedAt;

  return (
    <div className={styles.linkedCardItem}>
      <Icon
        name={isCompleted ? 'check circle' : 'circle outline'}
        className={isCompleted ? styles.completedIcon : styles.pendingIcon}
        size="small"
      />
      <button type="button" className={styles.linkedCardLink} onClick={handleCardClick}>
        {card.name}
      </button>
      {canEdit && (
        <button
          type="button"
          className={styles.linkedCardRemoveButton}
          onClick={handleRemoveClick}
          aria-label="Remove linked card"
        >
          <Icon name="close" size="small" />
        </button>
      )}
    </div>
  );
});

LinkedCardItem.propTypes = {
  linkedCardData: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  canEdit: PropTypes.bool.isRequired,
};

const BlockerItem = React.memo(({ blocker, canEdit }) => {
  const selectLinkedCards = useMemo(() => selectors.makeSelectLinkedCardsByBlockerId(), []);
  const linkedCards = useSelector((state) => selectLinkedCards(state, blocker.id));

  // 현재 보드의 카드 목록 (현재 열린 카드 제외)
  const cards = useSelector(selectors.selectCardsExceptCurrentForCurrentBoard);

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isLinking, setIsLinking] = useState(false);

  const isActive = blocker.status === 'active';

  // 이미 연결된 카드 ID 집합
  const alreadyLinkedCardIds = useMemo(
    () => new Set((linkedCards || []).map((link) => link.cardId)),
    [linkedCards],
  );

  // 드롭다운 옵션: 블로커 소유 카드와 이미 연결된 카드 제외
  const cardOptions = useMemo(
    () =>
      (cards || [])
        .filter((c) => c.id !== blocker.cardId && !alreadyLinkedCardIds.has(c.id))
        .map((c) => ({
          key: c.id,
          value: c.id,
          text: c.name,
        })),
    [cards, blocker.cardId, alreadyLinkedCardIds],
  );

  const handleResolveClick = useCallback(() => {
    dispatch(entryActions.updateBlocker(blocker.id, { status: 'resolved' }));
  }, [blocker.id, dispatch]);

  const handleDeleteClick = useCallback(() => {
    dispatch(entryActions.deleteBlocker(blocker.id));
  }, [blocker.id, dispatch]);

  const handleLinkCardClick = useCallback(() => {
    setIsLinking(true);
  }, []);

  const handleCardSelect = useCallback(
    (_, { value }) => {
      dispatch(entryActions.createBlockerLinkedCard(blocker.id, { cardId: value }));
      setIsLinking(false);
    },
    [blocker.id, dispatch],
  );

  const handleDropdownClose = useCallback(() => {
    setIsLinking(false);
  }, []);

  return (
    <div className={isActive ? styles.blockerItemActive : styles.blockerItemResolved}>
      <div className={styles.blockerHeader}>
        <Icon
          name="ban"
          className={isActive ? styles.blockerIconActive : styles.blockerIconResolved}
        />
        <span className={styles.blockerReason}>{blocker.reason}</span>
        <span className={isActive ? styles.statusActive : styles.statusResolved}>
          {isActive
            ? t('common.active', { defaultValue: 'Active' })
            : t('common.resolved', { defaultValue: 'Resolved' })}
        </span>
      </div>
      {linkedCards.length > 0 && (
        <div className={styles.linkedCardsList}>
          {linkedCards.map((linkedCardData) => (
            <LinkedCardItem
              key={linkedCardData.id}
              linkedCardData={linkedCardData}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
      {canEdit && isActive && (
        <div className={styles.blockerActions}>
          <Button size="mini" compact onClick={handleResolveClick}>
            <Icon name="check" />
            {t('action.resolve', { defaultValue: 'Resolve' })}
          </Button>
          {isLinking ? (
            <Dropdown
              search
              selection
              options={cardOptions}
              placeholder={t('common.searchCards', { defaultValue: 'Search cards...' })}
              selectOnBlur={false}
              openOnFocus
              className={styles.cardDropdown}
              onChange={handleCardSelect}
              onClose={handleDropdownClose}
            />
          ) : (
            <Button size="mini" compact onClick={handleLinkCardClick}>
              <Icon name="linkify" />
              {t('action.linkCard', { defaultValue: 'Link Card' })}
            </Button>
          )}
          <Button size="mini" compact className={styles.deleteButton} onClick={handleDeleteClick}>
            <Icon name="trash" />
          </Button>
        </div>
      )}
    </div>
  );
});

BlockerItem.propTypes = {
  blocker: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  canEdit: PropTypes.bool.isRequired,
};

const BlockerSection = React.memo(({ cardId, canEdit }) => {
  const selectBlockersByCardId = useMemo(() => selectors.makeSelectBlockersByCardId(), []);
  const blockers = useSelector((state) => selectBlockersByCardId(state, cardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [reason, setReason] = useState('');

  const handleAddClick = useCallback(() => {
    setIsAdding(true);
  }, []);

  const handleCancelClick = useCallback(() => {
    setIsAdding(false);
    setReason('');
  }, []);

  const handleReasonChange = useCallback((e) => {
    const { value } = e.target;
    if (value.length <= MAX_REASON_LENGTH) {
      setReason(value);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return;
    }

    dispatch(entryActions.createBlocker(cardId, { reason: trimmedReason }));
    setReason('');
    setIsAdding(false);
  }, [cardId, reason, dispatch]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleCancelClick();
      }
    },
    [handleSubmit, handleCancelClick],
  );

  if ((!blockers || blockers.length === 0) && !canEdit) {
    return null;
  }

  const activeBlockers = blockers ? blockers.filter((b) => b.status === 'active') : [];
  const resolvedBlockers = blockers ? blockers.filter((b) => b.status === 'resolved') : [];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Icon name="ban" className={styles.headerIcon} />
        <span className={styles.headerTitle}>
          {t('common.blockers', { defaultValue: 'Blockers' })}
        </span>
        {activeBlockers.length > 0 && (
          <span className={styles.activeCount}>{activeBlockers.length}</span>
        )}
      </div>
      <div className={styles.content}>
        {activeBlockers.map((blocker) => (
          <BlockerItem key={blocker.id} blocker={blocker} canEdit={canEdit} />
        ))}
        {resolvedBlockers.map((blocker) => (
          <BlockerItem key={blocker.id} blocker={blocker} canEdit={canEdit} />
        ))}
        {canEdit && !isAdding && (
          <Button size="small" className={styles.addButton} onClick={handleAddClick}>
            <Icon name="plus" />
            {t('action.addBlocker', { defaultValue: 'Add Blocker' })}
          </Button>
        )}
        {canEdit && isAdding && (
          <div className={styles.addForm}>
            <Input
              fluid
              placeholder={t('common.blockerReason', { defaultValue: 'Blocker reason...' })}
              value={reason}
              onChange={handleReasonChange}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className={styles.addFormActions}>
              <Button size="small" color="green" onClick={handleSubmit}>
                {t('action.add', { defaultValue: 'Add' })}
              </Button>
              <Button size="small" onClick={handleCancelClick}>
                {t('action.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

BlockerSection.propTypes = {
  cardId: PropTypes.string.isRequired,
  canEdit: PropTypes.bool.isRequired,
};

export default BlockerSection;
