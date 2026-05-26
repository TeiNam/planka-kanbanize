/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/closeplanka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Radio } from 'semantic-ui-react';
import { Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';

import styles from './EditSubColumnsStep.module.scss';

const EditSubColumnsStep = React.memo(({ listId, onBack, onClose }) => {
  const selectSubColumnCount = useMemo(() => selectors.makeSelectSubColumnCountByListId(), []);
  const childCount = useSelector((state) => selectSubColumnCount(state, listId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const wasEnabled = childCount > 0;
  const [enabled, setEnabled] = useState(wasEnabled);

  const handleChange = useCallback((_, { value }) => {
    setEnabled(value === 'on');
  }, []);

  const handleSubmit = useCallback(() => {
    if (enabled !== wasEnabled) {
      dispatch(
        entryActions.updateList(listId, {
          enableSubColumns: enabled,
        }),
      );
    }
    onClose();
  }, [enabled, wasEnabled, listId, dispatch, onClose]);

  return (
    <>
      <Popup.Header onBack={onBack}>
        {t('common.editSubColumns', { context: 'title', defaultValue: 'Sub-columns' })}
      </Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <Form.Field className={styles.field}>
            <Radio
              name="subColumns"
              value="off"
              checked={!enabled}
              label={t('common.subColumnsOff', { defaultValue: 'Off (single column)' })}
              onChange={handleChange}
            />
          </Form.Field>
          <Form.Field className={styles.field}>
            <Radio
              name="subColumns"
              value="on"
              checked={enabled}
              label={t('common.subColumnsOn', {
                defaultValue: 'On (split into Active / Done)',
              })}
              onChange={handleChange}
            />
            <div className={styles.help}>
              {t('common.subColumnsHint', {
                defaultValue:
                  'Cards in Done are ready to be pulled to the next column. Toggling off merges Done cards back.',
              })}
            </div>
          </Form.Field>
          <div className={styles.actions}>
            <Button positive type="submit" content={t('action.save', { defaultValue: 'Save' })} />
          </div>
        </Form>
      </Popup.Content>
    </>
  );
});

EditSubColumnsStep.propTypes = {
  listId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

EditSubColumnsStep.defaultProps = {
  onBack: undefined,
};

export default EditSubColumnsStep;
