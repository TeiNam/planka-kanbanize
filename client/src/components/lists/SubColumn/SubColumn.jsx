/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Droppable } from 'react-beautiful-dnd';

import selectors from '../../../selectors';
import DroppableTypes from '../../../constants/DroppableTypes';
import DraggableCard from '../../cards/DraggableCard';

import styles from './SubColumn.module.scss';

// 서브컬럼 유형 라벨
const SubColumnLabels = {
  active: 'common.active',
  done: 'common.done',
};

const SubColumn = React.memo(({ listId, type }) => {
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);
  const selectFilteredCardIdsByListId = useMemo(
    () => selectors.makeSelectFilteredCardIdsByListId(),
    [],
  );

  const list = useSelector((state) => selectListById(state, listId));
  const cardIds = useSelector((state) => selectFilteredCardIdsByListId(state, listId));

  const [t] = useTranslation();

  // WIP 초과 여부 계산
  const isWipExceeded = list.wipLimit != null && cardIds.length > list.wipLimit;

  return (
    <div className={styles.wrapper}>
      <div className={classNames(styles.header, isWipExceeded && styles.headerExceeded)}>
        <span className={styles.headerLabel}>{t(SubColumnLabels[type] || type)}</span>
        {list.wipLimit != null && (
          <span className={classNames(styles.wipDisplay, isWipExceeded && styles.wipExceeded)}>
            {cardIds.length}/{list.wipLimit}
          </span>
        )}
      </div>
      <div className={styles.cardsWrapper}>
        <Droppable
          droppableId={`list:${listId}`}
          type={DroppableTypes.CARD}
          isDropDisabled={!list.isPersisted}
        >
          {({ innerRef, droppableProps, placeholder }) => (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <div {...droppableProps} ref={innerRef}>
              <div className={styles.cards}>
                {cardIds.map((cardId, cardIndex) => (
                  <DraggableCard
                    key={cardId}
                    id={cardId}
                    index={cardIndex}
                    className={styles.card}
                  />
                ))}
                {placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
});

SubColumn.propTypes = {
  listId: PropTypes.string.isRequired,
  parentListId: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['active', 'done']).isRequired,
};

export default SubColumn;
