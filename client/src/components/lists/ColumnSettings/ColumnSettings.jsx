/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Form, TextArea } from 'semantic-ui-react';
import { Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { useForm } from '../../../hooks';

import styles from './ColumnSettings.module.scss';

const MAX_WIP_LIMIT = 100;
const MAX_TEXT_LENGTH = 500;

const ColumnSettings = React.memo(({ listId, onClose }) => {
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);
  const list = useSelector((state) => selectListById(state, listId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [data, handleFieldChange] = useForm(() => ({
    wipLimit: list.wipLimit != null ? String(list.wipLimit) : '',
    hasSubColumns: !!list.subColumnType || false,
    isBuffer: !!list.isBuffer,
    pullCriteria: list.pullCriteria || '',
    policy: list.policy || '',
  }));

  const handleSubmit = useCallback(() => {
    const wipLimitValue = data.wipLimit.trim();
    const wipLimit = wipLimitValue ? parseInt(wipLimitValue, 10) : null;

    // WIP 제한값 유효성 검증 (1~100 정수 또는 빈 값)
    if (wipLimit !== null && (Number.isNaN(wipLimit) || wipLimit < 1 || wipLimit > MAX_WIP_LIMIT)) {
      return;
    }

    const pullCriteria = data.pullCriteria.trim() || null;
    const policy = data.policy.trim() || null;

    // 텍스트 길이 검증
    if (pullCriteria && pullCriteria.length > MAX_TEXT_LENGTH) {
      return;
    }
    if (policy && policy.length > MAX_TEXT_LENGTH) {
      return;
    }

    dispatch(
      entryActions.updateList(listId, {
        wipLimit,
        isBuffer: data.isBuffer,
        pullCriteria,
        policy,
      }),
    );

    onClose();
  }, [listId, data, dispatch, onClose]);

  return (
    <>
      <Popup.Header>{t('common.columnSettings')}</Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit} className={styles.form}>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className={styles.fieldLabel}>{t('common.wipLimit')}</label>
            <Form.Input
              name="wipLimit"
              type="number"
              min={1}
              max={MAX_WIP_LIMIT}
              placeholder={t('common.unlimited')}
              value={data.wipLimit}
              onChange={handleFieldChange}
              className={styles.wipInput}
            />
          </Form.Field>

          <Form.Field className={styles.checkboxField}>
            <Checkbox
              toggle
              name="isBuffer"
              label={t('common.bufferColumn')}
              checked={data.isBuffer}
              onChange={handleFieldChange}
            />
          </Form.Field>

          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className={styles.fieldLabel}>{t('common.pullCriteria')}</label>
            <TextArea
              name="pullCriteria"
              maxLength={MAX_TEXT_LENGTH}
              placeholder={t('common.pullCriteriaPlaceholder')}
              value={data.pullCriteria}
              onChange={handleFieldChange}
              rows={3}
              className={styles.textarea}
            />
            <span className={styles.charCount}>
              {data.pullCriteria.length}/{MAX_TEXT_LENGTH}
            </span>
          </Form.Field>

          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className={styles.fieldLabel}>{t('common.policy')}</label>
            <TextArea
              name="policy"
              maxLength={MAX_TEXT_LENGTH}
              placeholder={t('common.policyPlaceholder')}
              value={data.policy}
              onChange={handleFieldChange}
              rows={3}
              className={styles.textarea}
            />
            <span className={styles.charCount}>
              {data.policy.length}/{MAX_TEXT_LENGTH}
            </span>
          </Form.Field>

          <Button positive content={t('action.save')} className={styles.submitButton} />
        </Form>
      </Popup.Content>
    </>
  );
});

ColumnSettings.propTypes = {
  listId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ColumnSettings;
