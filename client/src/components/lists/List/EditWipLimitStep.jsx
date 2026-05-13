/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input } from 'semantic-ui-react';
import { Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';

import styles from './EditWipLimitStep.module.scss';

const parseValue = (raw) => {
  const trimmed = String(raw).trim();
  if (trimmed === '' || trimmed === '0') {
    return null; // 0 또는 빈값 = 무제한
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    return undefined; // invalid
  }
  return n;
};

const EditWipLimitStep = React.memo(({ listId, onBack, onClose }) => {
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);
  const list = useSelector((state) => selectListById(state, listId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const initial =
    list && list.wipLimit !== null && list.wipLimit !== undefined ? String(list.wipLimit) : '';
  const [value, setValue] = useState(initial);
  const [error, setError] = useState(false);

  const handleChange = useCallback((_, { value: nextValue }) => {
    setValue(nextValue);
    setError(false);
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      if (event && event.preventDefault) event.preventDefault();
      const parsed = parseValue(value);
      if (parsed === undefined) {
        setError(true);
        return;
      }
      const current =
        list.wipLimit === null || list.wipLimit === undefined ? null : list.wipLimit;
      if (parsed !== current) {
        dispatch(entryActions.updateList(listId, { wipLimit: parsed }));
      }
      onClose();
    },
    [value, list, listId, dispatch, onClose],
  );

  const handleClear = useCallback(() => {
    if (list.wipLimit !== null && list.wipLimit !== undefined) {
      dispatch(entryActions.updateList(listId, { wipLimit: null }));
    }
    onClose();
  }, [list, listId, dispatch, onClose]);

  return (
    <>
      <Popup.Header onBack={onBack}>
        {t('common.editWipLimit', { context: 'title', defaultValue: 'Edit WIP limit' })}
      </Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <Input
            fluid
            type="number"
            min={0}
            max={100}
            placeholder={t('common.unlimited', { defaultValue: 'No limit' })}
            value={value}
            error={error}
            onChange={handleChange}
            className={styles.input}
            autoFocus
          />
          <div className={styles.help}>
            {t('common.wipLimitHint', {
              defaultValue: '1~100. Leave empty or set to 0 for no limit.',
            })}
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              basic
              content={t('action.clear', { defaultValue: 'Clear' })}
              onClick={handleClear}
            />
            <Button
              positive
              type="submit"
              content={t('action.save', { defaultValue: 'Save' })}
            />
          </div>
        </Form>
      </Popup.Content>
    </>
  );
});

EditWipLimitStep.propTypes = {
  listId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

EditWipLimitStep.defaultProps = {
  onBack: undefined,
};

export default EditWipLimitStep;
