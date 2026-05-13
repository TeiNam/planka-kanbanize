/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'semantic-ui-react';

import selectors from '../../selectors';
import entryActions from '../../entry-actions';
import { BoardMembershipRoles } from '../../constants/Enums';
import { useForm } from '../../hooks';

import styles from './AddSwimLaneButton.module.scss';

// 스윔레인 카테고리 옵션
const CATEGORY_OPTIONS = [
  { key: 'none', value: '', text: 'None' },
  { key: 'work_item_type', value: 'work_item_type', text: 'Work Item Type' },
  { key: 'class_of_service', value: 'class_of_service', text: 'Class of Service' },
  { key: 'requestor', value: 'requestor', text: 'Requestor' },
  { key: 'project', value: 'project', text: 'Project' },
];

const DEFAULT_DATA = {
  name: '',
  category: '',
};

const AddSwimLaneButton = React.memo(() => {
  const canEdit = useSelector((state) => {
    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isFormOpened, setIsFormOpened] = useState(false);
  const [data, handleFieldChange, setData] = useForm(DEFAULT_DATA);

  const handleOpenClick = useCallback(() => {
    setIsFormOpened(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsFormOpened(false);
    setData(DEFAULT_DATA);
  }, [setData]);

  const handleSubmit = useCallback(() => {
    const trimmedName = data.name.trim();

    if (!trimmedName || trimmedName.length > 50) {
      return;
    }

    const swimLaneData = {
      name: trimmedName,
      type: 'standard',
    };

    if (data.category) {
      swimLaneData.category = data.category;
    }

    dispatch(entryActions.createSwimLaneInCurrentBoard(swimLaneData));
    handleClose();
  }, [data, dispatch, handleClose]);

  if (!canEdit) {
    return null;
  }

  if (!isFormOpened) {
    return (
      <button type="button" className={styles.addButton} onClick={handleOpenClick}>
        <span className={styles.addButtonText}>
          + {t('action.addSwimLane', { defaultValue: 'Add Swim Lane' })}
        </span>
      </button>
    );
  }

  return (
    <div className={styles.formWrapper}>
      <Form onSubmit={handleSubmit}>
        <Form.Input
          name="name"
          placeholder={t('common.enterSwimLaneName', { defaultValue: 'Enter swim lane name...' })}
          value={data.name}
          maxLength={50}
          autoFocus
          onChange={handleFieldChange}
        />
        <Form.Select
          name="category"
          label={t('common.category', { defaultValue: 'Category' })}
          options={CATEGORY_OPTIONS}
          value={data.category}
          onChange={handleFieldChange}
        />
        <div className={styles.formActions}>
          <Button
            positive
            content={t('action.addSwimLane', { defaultValue: 'Add Swim Lane' })}
            disabled={!data.name.trim()}
          />
          <Button
            type="button"
            content={t('action.cancel', { defaultValue: 'Cancel' })}
            onClick={handleClose}
          />
        </div>
      </Form>
    </div>
  );
});

export default AddSwimLaneButton;
