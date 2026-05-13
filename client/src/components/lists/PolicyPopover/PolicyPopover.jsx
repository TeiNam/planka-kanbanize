/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';

import styles from './PolicyPopover.module.scss';

const PolicyPopover = React.memo(({ text }) => {
  const [t] = useTranslation();

  if (!text) {
    return null;
  }

  return (
    <Popup
      trigger={
        <div className={styles.wrapper}>
          <div className={styles.label}>{t('common.policy')}</div>
          <div className={styles.text}>{text}</div>
        </div>
      }
      content={
        <div className={styles.popoverContent}>
          <div className={styles.popoverLabel}>{t('common.policy')}</div>
          <div className={styles.popoverText}>{text}</div>
        </div>
      }
      position="bottom center"
      hoverable
      wide="very"
      on={['click', 'hover']}
    />
  );
});

PolicyPopover.propTypes = {
  text: PropTypes.string,
};

PolicyPopover.defaultProps = {
  text: undefined,
};

export default PolicyPopover;
