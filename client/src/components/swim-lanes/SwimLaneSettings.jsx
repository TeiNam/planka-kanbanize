/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'semantic-ui-react';
import { Popup } from '../../lib/custom-ui';

import selectors from '../../selectors';
import entryActions from '../../entry-actions';
import { useForm, useSteps } from '../../hooks';
import ConfirmationStep from '../common/ConfirmationStep';

import styles from './SwimLaneSettings.module.scss';

// 스윔레인 카테고리 옵션
const CATEGORY_OPTIONS = [
  { key: 'none', value: '', text: 'None' },
  { key: 'work_item_type', value: 'work_item_type', text: 'Work Item Type' },
  { key: 'class_of_service', value: 'class_of_service', text: 'Class of Service' },
  { key: 'requestor', value: 'requestor', text: 'Requestor' },
  { key: 'project', value: 'project', text: 'Project' },
];

const StepTypes = {
  DELETE: 'DELETE',
};

const SwimLaneSettings = React.memo(({ swimLaneId, onClose }) => {
  const selectSwimLaneWipCount = useMemo(() => selectors.makeSelectSwimLaneWipCount(), []);

  const swimLane = useSelector((state) => {
    const { boardId } = selectors.selectPath(state);
    const allSwimLanes = selectors.selectSwimLanesByBoardId(state, boardId);
    return allSwimLanes ? allSwimLanes.find((sl) => sl.id === swimLaneId) : null;
  });

  const wipCount = useSelector((state) => selectSwimLaneWipCount(state, swimLaneId));

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [step, openStep, handleBack] = useSteps();

  const [data, handleFieldChange] = useForm(() => ({
    name: swimLane ? swimLane.name : '',
    wipLimit: swimLane && swimLane.wipLimit != null ? String(swimLane.wipLimit) : '',
    category: swimLane ? swimLane.category || '' : '',
    color: swimLane ? swimLane.color || '' : '',
  }));

  const handleSubmit = useCallback(() => {
    const updates = {};

    if (data.name && data.name !== swimLane.name) {
      updates.name = data.name;
    }

    const parsedWipLimit = data.wipLimit === '' ? null : parseInt(data.wipLimit, 10);
    if (parsedWipLimit !== swimLane.wipLimit) {
      if (parsedWipLimit === null || (parsedWipLimit >= 1 && parsedWipLimit <= 100)) {
        updates.wipLimit = parsedWipLimit;
      }
    }

    const newCategory = data.category || null;
    if (newCategory !== swimLane.category) {
      updates.category = newCategory;
    }

    const newColor = data.color || null;
    if (newColor !== swimLane.color) {
      updates.color = newColor;
    }

    if (Object.keys(updates).length > 0) {
      dispatch(entryActions.updateSwimLane(swimLaneId, updates));
    }

    onClose();
  }, [data, swimLane, swimLaneId, dispatch, onClose]);

  const handleDeleteClick = useCallback(() => {
    openStep(StepTypes.DELETE);
  }, [openStep]);

  const handleDeleteConfirm = useCallback(() => {
    dispatch(entryActions.deleteSwimLane(swimLaneId));
    onClose();
  }, [swimLaneId, dispatch, onClose]);

  if (!swimLane) {
    return null;
  }

  if (step) {
    switch (step.type) {
      case StepTypes.DELETE:
        return (
          <ConfirmationStep
            title="common.deleteSwimLane"
            content="common.areYouSureYouWantToDeleteThisSwimLane"
            buttonContent="action.deleteSwimLane"
            onConfirm={handleDeleteConfirm}
            onBack={handleBack}
          />
        );
      default:
    }
  }

  const hasCards = wipCount > 0;

  return (
    <>
      <Popup.Header>
        {t('common.swimLaneSettings', {
          context: 'title',
          defaultValue: 'Swim Lane Settings',
        })}
      </Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{t('common.name', { defaultValue: 'Name' })}</label>
            <Form.Input name="name" value={data.name} maxLength={50} onChange={handleFieldChange} />
          </Form.Field>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{t('common.wipLimit', { defaultValue: 'WIP Limit' })}</label>
            <Form.Input
              name="wipLimit"
              type="number"
              min={1}
              max={100}
              placeholder={t('common.unlimited', { defaultValue: 'Unlimited' })}
              value={data.wipLimit}
              onChange={handleFieldChange}
            />
          </Form.Field>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{t('common.category', { defaultValue: 'Category' })}</label>
            <Form.Select
              name="category"
              options={CATEGORY_OPTIONS}
              value={data.category}
              onChange={handleFieldChange}
            />
          </Form.Field>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{t('common.color', { defaultValue: 'Color' })}</label>
            <Form.Input
              name="color"
              placeholder={t('common.none', { defaultValue: 'None' })}
              value={data.color}
              onChange={handleFieldChange}
            />
          </Form.Field>
          <Button positive content={t('action.save', { defaultValue: 'Save' })} />
        </Form>
        <div className={styles.deleteSection}>
          <Button
            negative
            content={t('action.deleteSwimLane', { defaultValue: 'Delete Swim Lane' })}
            disabled={hasCards}
            onClick={handleDeleteClick}
          />
          {hasCards && (
            <p className={styles.deleteHint}>
              {t('common.swimLaneHasCards', {
                defaultValue: 'Move or delete all cards before deleting this swim lane.',
              })}
            </p>
          )}
        </div>
      </Popup.Content>
    </>
  );
});

SwimLaneSettings.propTypes = {
  swimLaneId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SwimLaneSettings;
