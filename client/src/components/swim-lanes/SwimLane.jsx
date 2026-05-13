/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { Draggable } from 'react-beautiful-dnd';

import selectors from '../../selectors';
import SwimLaneHeader from './SwimLaneHeader';

import styles from './SwimLane.module.scss';

// 스윔레인 타입 상수
const SwimLaneTypes = {
  STANDARD: 'standard',
  EXPEDITE: 'expedite',
};

const SwimLane = React.memo(({ id, index }) => {
  const swimLane = useSelector((state) => {
    const { boardId } = selectors.selectPath(state);
    const allSwimLanes = selectors.selectSwimLanesByBoardId(state, boardId);
    return allSwimLanes ? allSwimLanes.find((sl) => sl.id === id) : null;
  });

  if (!swimLane) {
    return null;
  }

  const isExpedite = swimLane.type === SwimLaneTypes.EXPEDITE;
  const isDragDisabled = !swimLane.isPersisted || isExpedite;

  return (
    <Draggable draggableId={`swim-lane:${id}`} index={index} isDragDisabled={isDragDisabled}>
      {({ innerRef, draggableProps, dragHandleProps }, snapshot) => (
        <div
          {...draggableProps} // eslint-disable-line react/jsx-props-no-spreading
          ref={innerRef}
          className={classNames(styles.wrapper, snapshot.isDragging && styles.wrapperDragging)}
        >
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <div {...dragHandleProps} className={styles.dragHandle}>
            <SwimLaneHeader swimLaneId={id} />
          </div>
          <div className={styles.content}>{/* 카드 그리드는 보드 레이아웃에서 렌더링됨 */}</div>
        </div>
      )}
    </Draggable>
  );
});

SwimLane.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

export default SwimLane;
