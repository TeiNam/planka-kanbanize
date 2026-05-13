/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Form, Icon } from 'semantic-ui-react';

import selectors from '../../selectors';
import { useForm } from '../../hooks';

import styles from './MetricsFilter.module.scss';

// 날짜 범위 기본값 및 제한
const DEFAULT_DAYS = 30;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

const MetricsFilter = React.memo(({ boardId, onApply, isLoading }) => {
  const [t] = useTranslation();

  const selectClassesOfService = useMemo(() => selectors.makeSelectClassesOfServiceByBoardId(), []);

  const classesOfService = useSelector((state) => selectClassesOfService(state, boardId));

  const [formData, , setFormData] = useForm(() => ({
    days: DEFAULT_DAYS,
    classOfServiceIds: [],
  }));

  // CoS 드롭다운 옵션 생성
  const cosOptions = useMemo(() => {
    if (!classesOfService) {
      return [];
    }

    return classesOfService.map((cos) => ({
      key: cos.id,
      value: cos.id,
      text: cos.name,
      label: { color: cos.color, empty: true, circular: true },
    }));
  }, [classesOfService]);

  const handleDaysChange = useCallback(
    (e) => {
      const value = parseInt(e.target.value, 10);
      if (Number.isNaN(value)) {
        return;
      }
      const clamped = Math.min(MAX_DAYS, Math.max(MIN_DAYS, value));
      setFormData((prev) => ({ ...prev, days: clamped }));
    },
    [setFormData],
  );

  const handleCosChange = useCallback(
    (e, { value }) => {
      setFormData((prev) => ({ ...prev, classOfServiceIds: value }));
    },
    [setFormData],
  );

  const handleApply = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - formData.days);

    onApply({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      classOfServiceIds:
        formData.classOfServiceIds.length > 0 ? formData.classOfServiceIds : undefined,
    });
  }, [formData, onApply]);

  return (
    <div className={styles.wrapper}>
      <Form size="small" className={styles.form}>
        <Form.Field className={styles.field}>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>{t('common.dateRange', { defaultValue: 'Date Range (days)' })}</label>
          <Form.Input
            type="number"
            min={MIN_DAYS}
            max={MAX_DAYS}
            value={formData.days}
            onChange={handleDaysChange}
            className={styles.daysInput}
          />
        </Form.Field>
        <Form.Field className={styles.field}>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>{t('common.classOfService', { defaultValue: 'Class of Service' })}</label>
          <Dropdown
            multiple
            selection
            clearable
            placeholder={t('common.all', { defaultValue: 'All' })}
            options={cosOptions}
            value={formData.classOfServiceIds}
            onChange={handleCosChange}
            className={styles.cosDropdown}
          />
        </Form.Field>
        <Form.Field className={styles.applyField}>
          <Button primary loading={isLoading} disabled={isLoading} onClick={handleApply}>
            <Icon name="filter" />
            {t('action.apply', { defaultValue: 'Apply' })}
          </Button>
        </Form.Field>
      </Form>
      <div className={styles.currentFilter}>
        <span className={styles.filterInfo}>
          {t('common.showing', { defaultValue: 'Showing' })}: {formData.days}{' '}
          {t('common.days', { defaultValue: 'days' })}
          {formData.classOfServiceIds.length > 0 &&
            ` | ${formData.classOfServiceIds.length} ${t('common.classesOfServiceSelected', { defaultValue: 'CoS selected' })}`}
        </span>
      </div>
    </div>
  );
});

MetricsFilter.propTypes = {
  boardId: PropTypes.string.isRequired,
  onApply: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

MetricsFilter.defaultProps = {
  isLoading: false,
};

export default MetricsFilter;
