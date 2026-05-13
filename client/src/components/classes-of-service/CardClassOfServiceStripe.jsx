/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import selectors from '../../selectors';

import styles from './CardClassOfServiceStripe.module.scss';

// 카드 좌측 4px 색상 띠 - CoS 할당 시 표시
const CardClassOfServiceStripe = React.memo(({ classOfServiceId }) => {
  const selectClassOfServiceById = useMemo(() => selectors.makeSelectClassOfServiceById(), []);

  const classOfService = useSelector((state) => selectClassOfServiceById(state, classOfServiceId));

  if (!classOfServiceId || !classOfService) {
    return null;
  }

  return (
    <div
      className={styles.stripe}
      style={{ backgroundColor: classOfService.color }}
      title={classOfService.name}
    />
  );
});

CardClassOfServiceStripe.propTypes = {
  classOfServiceId: PropTypes.string,
};

CardClassOfServiceStripe.defaultProps = {
  classOfServiceId: null,
};

export default CardClassOfServiceStripe;
