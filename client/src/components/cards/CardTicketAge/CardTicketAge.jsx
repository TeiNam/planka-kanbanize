/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import selectors from '../../../selectors';

import styles from './CardTicketAge.module.scss';

// 티켓 나이 표시 컴포넌트
// Commitment Point 진입일(또는 카드 생성일)부터 현재까지의 경과 일수를 "N일" 형식으로 표시
const CardTicketAge = React.memo(({ cardId }) => {
  const selectTicketAge = useMemo(() => selectors.makeSelectTicketAge(), []);
  const age = useSelector((state) => selectTicketAge(state, cardId));

  if (!age || age === 0) {
    return null;
  }

  return <span className={styles.wrapper}>{age}일</span>;
});

CardTicketAge.propTypes = {
  cardId: PropTypes.string.isRequired,
};

export default CardTicketAge;
