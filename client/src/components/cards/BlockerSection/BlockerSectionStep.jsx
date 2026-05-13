/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Popup } from '../../../lib/custom-ui';

import BlockerSection from './BlockerSection';

import styles from './BlockerSectionStep.module.scss';

const BlockerSectionStep = React.memo(({ cardId, canEdit }) => {
  const [t] = useTranslation();

  return (
    <>
      <Popup.Header>
        {t('common.blockers', { defaultValue: 'Blockers' })}
      </Popup.Header>
      <Popup.Content>
        <div className={styles.content}>
          <BlockerSection cardId={cardId} canEdit={canEdit} />
        </div>
      </Popup.Content>
    </>
  );
});

BlockerSectionStep.propTypes = {
  cardId: PropTypes.string.isRequired,
  canEdit: PropTypes.bool.isRequired,
};

export default BlockerSectionStep;
