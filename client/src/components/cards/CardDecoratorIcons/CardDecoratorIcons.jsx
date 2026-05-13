/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';

import styles from './CardDecoratorIcons.module.scss';

const MAX_DECORATORS = 5;

// 데코레이터 아이콘 표시 컴포넌트
// 카드에 연결된 데코레이터의 아이콘/이모지를 최대 5개까지 표시
// 5개 초과 시 "+N" 형태의 잘림 표시기를 표시
const CardDecoratorIcons = React.memo(({ decorators }) => {
  if (!decorators || decorators.length === 0) {
    return null;
  }

  const visibleDecorators = decorators.slice(0, MAX_DECORATORS);
  const overflowCount = decorators.length - MAX_DECORATORS;

  return (
    <span className={styles.wrapper}>
      {visibleDecorators.map((decorator) => (
        <span
          key={decorator.id}
          className={styles.icon}
          style={decorator.color ? { color: decorator.color } : undefined}
          title={decorator.name}
        >
          {decorator.icon}
        </span>
      ))}
      {overflowCount > 0 && <span className={styles.overflow}>+{overflowCount}</span>}
    </span>
  );
});

CardDecoratorIcons.propTypes = {
  decorators: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      icon: PropTypes.string,
      color: PropTypes.string,
    }),
  ),
};

CardDecoratorIcons.defaultProps = {
  decorators: undefined,
};

export default CardDecoratorIcons;
