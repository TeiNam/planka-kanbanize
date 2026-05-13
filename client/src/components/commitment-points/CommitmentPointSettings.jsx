/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'semantic-ui-react';
import { Popup } from '../../lib/custom-ui';

import selectors from '../../selectors';
import entryActions from '../../entry-actions';
import { useForm, useSteps } from '../../hooks';
import ConfirmationStep from '../common/ConfirmationStep';

import styles from './CommitmentPointSettings.module.scss';

// Commitment Point 타입 옵션
const TYPE_OPTIONS = [
  { key: 'commitment', value: 'commitment', text: 'Commitment' },
  { key: 'delivery', value: 'delivery', text: 'Delivery' },
];

const StepTypes = {
  DELETE: 'DELETE',
};

const CommitmentPointSettings = React.memo(({ commitmentPointId, onClose }) => {
  const commitmentPoint = useSelector((state) => {
    const { boardId } = selectors.selectPath(state);
    const allCPs = selectors.selectCommitmentPointsByBoardId(state, boardId);
    return allCPs ? allCPs.find((cp) => cp.id === commitmentPointId) : null;
  });

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [step, openStep, handleBack] = useSteps();

  const [data, handleFieldChange] = useForm(() => ({
    label: commitmentPoint ? commitmentPoint.label || '' : '',
    type: commitmentPoint ? commitmentPoint.type || 'commitment' : 'commitment',
  }));

  const handleSubmit = useCallback(() => {
    const updates = {};

    const newLabel = data.label.trim() || null;
    if (newLabel !== (commitmentPoint.label || null)) {
      updates.label = newLabel;
    }

    if (data.type !== commitmentPoint.type) {
      updates.type = data.type;
    }

    if (Object.keys(updates).length > 0) {
      dispatch(entryActions.updateCommitmentPoint(commitmentPointId, updates));
    }

    onClose();
  }, [data, commitmentPoint, commitmentPointId, dispatch, onClose]);

  const handleDeleteClick = useCallback(() => {
    openStep(StepTypes.DELETE);
  }, [openStep]);

  const handleDeleteConfirm = useCallback(() => {
    dispatch(entryActions.deleteCommitmentPoint(commitmentPointId));
    onClose();
  }, [commitmentPointId, dispatch, onClose]);

  if (!commitmentPoint) {
    return null;
  }

  if (step) {
    switch (step.type) {
      case StepTypes.DELETE:
        return (
          <ConfirmationStep
            title="common.deleteCommitmentPoint"
            content="common.areYouSureYouWantToDeleteThisCommitmentPoint"
            buttonContent="action.deleteCommitmentPoint"
            onConfirm={handleDeleteConfirm}
            onBack={handleBack}
          />
        );
      default:
    }
  }

  return (
    <>
      <Popup.Header>
        {t('common.commitmentPointSettings', {
          context: 'title',
          defaultValue: 'Commitment Point Settings',
        })}
      </Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{t('common.label', { defaultValue: 'Label' })}</label>
            <Form.Input
              name="label"
              value={data.label}
              maxLength={50}
              placeholder={t('common.optional', { defaultValue: 'Optional' })}
              onChange={handleFieldChange}
            />
          </Form.Field>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{t('common.type', { defaultValue: 'Type' })}</label>
            <Form.Select
              name="type"
              options={TYPE_OPTIONS}
              value={data.type}
              onChange={handleFieldChange}
            />
          </Form.Field>
          <Button positive content={t('action.save', { defaultValue: 'Save' })} />
        </Form>
        <div className={styles.deleteSection}>
          <Button
            negative
            content={t('action.deleteCommitmentPoint', {
              defaultValue: 'Delete Commitment Point',
            })}
            onClick={handleDeleteClick}
          />
        </div>
      </Popup.Content>
    </>
  );
});

CommitmentPointSettings.propTypes = {
  commitmentPointId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CommitmentPointSettings;
