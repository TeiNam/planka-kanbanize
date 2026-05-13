/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from 'semantic-ui-react';

import styles from './WipExceededConfirmDialog.module.scss';

// WIP 초과 이동 시 확인 대화상자
// 소프트 제한: 이동을 차단하지 않되, 이동 직전에 WIP 초과를 알리는 확인 대화상자 표시
const WipExceededConfirmDialog = React.memo(
  ({ open, listName, wipLimit, currentCount, onConfirm, onCancel }) => {
    const [t] = useTranslation();

    const handleConfirm = useCallback(() => {
      onConfirm();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
      onCancel();
    }, [onCancel]);

    return (
      <Modal open={open} size="tiny" onClose={handleCancel}>
        <Modal.Header className={styles.header}>
          {t('common.wipLimitExceeded', { defaultValue: 'WIP Limit Exceeded' })}
        </Modal.Header>
        <Modal.Content className={styles.content}>
          <p className={styles.message}>
            {t('common.wipLimitExceededMessage', {
              defaultValue: `Moving this card will exceed the WIP limit for "${listName}" (${currentCount + 1}/${wipLimit}). Do you want to proceed?`,
              listName,
              current: currentCount + 1,
              limit: wipLimit,
            })}
          </p>
          <p className={styles.warning}>
            {t('common.wipLimitExceededWarning', {
              defaultValue: 'Exceeding WIP limits may impact flow efficiency.',
            })}
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={handleCancel}>{t('action.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button negative onClick={handleConfirm}>
            {t('action.moveAnyway', { defaultValue: 'Move Anyway' })}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  },
);

WipExceededConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  listName: PropTypes.string.isRequired,
  wipLimit: PropTypes.number.isRequired,
  currentCount: PropTypes.number.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default WipExceededConfirmDialog;
