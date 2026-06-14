/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import styles from './CalendarItems.module.scss';

// 마감일 카드(Due_Date_Item) — 읽기 전용 항목.
// - 일정 수정/삭제 컨트롤을 노출하지 않는다 (R8.4).
// - 일정(Event)과 시각적으로 구분되는 스타일(주황 좌측 바, scss)을 사용한다 (R8.2).
// - 클릭(또는 Enter/Space) 시 onClick(cardId) 으로 해당 카드 열기를 상위에 위임한다 (R8.3).
//   상위(CalendarContent)는 카드 라우트로 이동(dispatch(push(Paths.CARDS...)))해 카드 모달을 연다.
const DueDateItem = React.memo(({ cardId, name, onClick }) => {
  const handleClick = useCallback(
    (event) => {
      // 셀 클릭(일정 생성)으로 전파되지 않도록 차단한다.
      event.stopPropagation();

      if (onClick) {
        onClick(cardId);
      }
    },
    [cardId, onClick],
  );

  // 접근성: role="button" 이므로 Enter/Space 키로도 카드를 열 수 있게 한다.
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick(event);
      }
    },
    [handleClick],
  );

  return (
    <div
      className={styles.dueDateItem}
      title={name}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.dueDateName}>{name}</span>
    </div>
  );
});

DueDateItem.propTypes = {
  cardId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

DueDateItem.defaultProps = {
  onClick: undefined,
};

export default DueDateItem;
