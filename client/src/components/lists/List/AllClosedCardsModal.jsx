/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Modal } from 'semantic-ui-react';

import Card from '../../cards/Card';

import styles from './AllClosedCardsModal.module.scss';

const AllClosedCardsModal = React.memo(({ listName, cardIds, onClose }) => {
  const [t] = useTranslation();

  return (
    <Modal open size="small" onClose={onClose} className={styles.modal}>
      <Modal.Header>
        {t('common.allCompletedCards', { defaultValue: '완료된 카드 전체' })}
        {listName ? ` — ${listName}` : ''}
        <span className={styles.count}>{(cardIds || []).length}</span>
      </Modal.Header>
      <Modal.Content scrolling className={styles.content}>
        <div className={styles.cards}>
          {(cardIds || []).map((cardId) => (
            <div key={cardId} className={styles.card}>
              <Card id={cardId} />
            </div>
          ))}
        </div>
      </Modal.Content>
    </Modal>
  );
});

AllClosedCardsModal.propTypes = {
  listName: PropTypes.string,
  cardIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
};

AllClosedCardsModal.defaultProps = {
  listName: '',
};

export default AllClosedCardsModal;
