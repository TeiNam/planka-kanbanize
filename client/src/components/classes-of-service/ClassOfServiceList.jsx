/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Icon, Label } from 'semantic-ui-react';

import selectors from '../../selectors';
import entryActions from '../../entry-actions';
import { useForm } from '../../hooks';

import styles from './ClassOfServiceList.module.scss';

// 최대 사용자 정의 CoS 수
const MAX_CUSTOM_COS = 10;

// CoS 타입 배지 색상 매핑
const TYPE_BADGE_COLORS = {
  expedite: 'red',
  fixed_date: 'orange',
  standard: 'blue',
  intangible: 'grey',
  custom: 'teal',
};

const ClassOfServiceList = React.memo(({ boardId }) => {
  const [t] = useTranslation();
  const dispatch = useDispatch();

  const selectClassesOfService = useMemo(() => selectors.makeSelectClassesOfServiceByBoardId(), []);

  const classesOfService = useSelector((state) => selectClassesOfService(state, boardId));

  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const customCount = useMemo(
    () => (classesOfService ? classesOfService.filter((cos) => !cos.isDefault).length : 0),
    [classesOfService],
  );

  const canAddCustom = customCount < MAX_CUSTOM_COS;

  // 편집 폼 데이터
  const [formData, handleFieldChange, setFormData] = useForm(() => ({
    name: '',
    color: '#109dc0',
    policy: '',
  }));

  const handleEditClick = useCallback(
    (cos) => {
      setEditingId(cos.id);
      setIsAdding(false);
      setFormData({
        name: cos.name,
        color: cos.color || '#109dc0',
        policy: cos.policy || '',
      });
    },
    [setFormData],
  );

  const handleAddClick = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      color: '#109dc0',
      policy: '',
    });
  }, [setFormData]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!formData.name || formData.name.trim().length === 0) {
      return;
    }

    if (editingId) {
      dispatch(
        entryActions.updateClassOfService(editingId, {
          name: formData.name.trim().slice(0, 30),
          color: formData.color,
          policy: formData.policy ? formData.policy.trim().slice(0, 500) : null,
        }),
      );
    }

    setEditingId(null);
  }, [editingId, formData, dispatch]);

  const handleSaveNew = useCallback(() => {
    if (!formData.name || formData.name.trim().length === 0) {
      return;
    }

    dispatch(
      entryActions.createClassOfServiceInCurrentBoard({
        name: formData.name.trim().slice(0, 30),
        color: formData.color,
        policy: formData.policy ? formData.policy.trim().slice(0, 500) : null,
      }),
    );

    setIsAdding(false);
  }, [formData, dispatch]);

  const handleDelete = useCallback(
    (id) => {
      dispatch(entryActions.deleteClassOfService(id));
    },
    [dispatch],
  );

  if (!classesOfService) {
    return null;
  }

  // 편집 폼 렌더링
  const renderEditForm = (isNew) => (
    <div className={styles.editForm}>
      <Form size="small">
        <Form.Field>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>{t('common.name', { defaultValue: 'Name' })}</label>
          <Form.Input
            name="name"
            value={formData.name}
            maxLength={30}
            placeholder={t('common.enterName', { defaultValue: 'Enter name...' })}
            onChange={handleFieldChange}
          />
        </Form.Field>
        <Form.Field>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>{t('common.color', { defaultValue: 'Color' })}</label>
          <Form.Input
            name="color"
            type="color"
            value={formData.color}
            onChange={handleFieldChange}
          />
        </Form.Field>
        <Form.Field>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>{t('common.policy', { defaultValue: 'Policy' })}</label>
          <Form.TextArea
            name="policy"
            value={formData.policy}
            maxLength={500}
            rows={3}
            placeholder={t('common.enterPolicy', { defaultValue: 'Enter policy...' })}
            onChange={handleFieldChange}
          />
        </Form.Field>
        <div className={styles.editFormActions}>
          <Button
            positive
            size="small"
            content={t('action.save', { defaultValue: 'Save' })}
            onClick={isNew ? handleSaveNew : handleSaveEdit}
          />
          <Button
            size="small"
            content={t('action.cancel', { defaultValue: 'Cancel' })}
            onClick={handleCancelEdit}
          />
        </div>
      </Form>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          {t('common.classesOfService', { defaultValue: 'Classes of Service' })}
        </h4>
      </div>
      <div className={styles.list}>
        {classesOfService.map((cos) => (
          <div key={cos.id} className={styles.item}>
            {editingId === cos.id ? (
              renderEditForm(false)
            ) : (
              <div className={styles.itemContent}>
                <div className={styles.colorSwatch} style={{ backgroundColor: cos.color }} />
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{cos.name}</span>
                  <Label
                    size="mini"
                    color={TYPE_BADGE_COLORS[cos.type] || 'grey'}
                    content={cos.type}
                  />
                  {cos.policy && (
                    <span className={styles.policyPreview}>
                      {cos.policy.length > 50 ? `${cos.policy.slice(0, 50)}...` : cos.policy}
                    </span>
                  )}
                </div>
                <div className={styles.itemActions}>
                  {cos.isDefault && (
                    <Icon name="lock" className={styles.lockIcon} title="Default" />
                  )}
                  {!cos.isDefault && (
                    <>
                      <Button icon="edit" size="mini" basic onClick={() => handleEditClick(cos)} />
                      <Button
                        icon="trash"
                        size="mini"
                        basic
                        color="red"
                        onClick={() => handleDelete(cos.id)}
                      />
                    </>
                  )}
                  {cos.isDefault && (
                    <Button icon="edit" size="mini" basic onClick={() => handleEditClick(cos)} />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdding && renderEditForm(true)}
      {!isAdding && (
        <Button
          fluid
          disabled={!canAddCustom}
          className={styles.addButton}
          onClick={handleAddClick}
        >
          <Icon name="plus" />
          {t('action.addCustomClassOfService', { defaultValue: 'Add Custom' })}
          {!canAddCustom && (
            <span className={styles.limitHint}>
              {` (${t('common.maxReached', { defaultValue: 'max reached' })})`}
            </span>
          )}
        </Button>
      )}
    </div>
  );
});

ClassOfServiceList.propTypes = {
  boardId: PropTypes.string.isRequired,
};

export default ClassOfServiceList;
