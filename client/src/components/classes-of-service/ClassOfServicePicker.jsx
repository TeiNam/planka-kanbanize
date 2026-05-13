/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';
import { Popup } from '../../lib/custom-ui';

import selectors from '../../selectors';

import styles from './ClassOfServicePicker.module.scss';

const ClassOfServicePicker = React.memo(({ cardId, currentClassOfServiceId, onSelect, onBack }) => {
  const [t] = useTranslation();

  const { boardId } = useSelector((state) => selectors.selectPath(state));

  const selectClassesOfService = useMemo(() => selectors.makeSelectClassesOfServiceByBoardId(), []);

  const classesOfService = useSelector((state) => selectClassesOfService(state, boardId));

  // 카드의 dueDate 확인 (Fixed_Date 할당 시 필요)
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);
  const card = useSelector((state) => selectCardById(state, cardId));
  const hasDueDate = card && card.dueDate != null;

  const handleItemClick = useCallback(
    (cosId) => {
      if (cosId === currentClassOfServiceId) {
        return;
      }
      onSelect(cosId);
    },
    [currentClassOfServiceId, onSelect],
  );

  const handleNoneClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  if (!classesOfService) {
    return null;
  }

  return (
    <>
      <Popup.Header onBack={onBack}>
        {t('common.classOfService', {
          context: 'title',
          defaultValue: 'Class of Service',
        })}
      </Popup.Header>
      <Popup.Content>
        <div className={styles.list}>
          {/* None 옵션 */}
          <button
            type="button"
            className={`${styles.item} ${!currentClassOfServiceId ? styles.itemActive : ''}`}
            onClick={handleNoneClick}
          >
            <div className={styles.colorSwatch} style={{ backgroundColor: '#ccc' }} />
            <span className={styles.itemName}>{t('common.none', { defaultValue: 'None' })}</span>
            {!currentClassOfServiceId && <Icon name="check" className={styles.checkIcon} />}
          </button>

          {/* CoS 목록 */}
          {classesOfService.map((cos) => {
            const isSelected = cos.id === currentClassOfServiceId;
            const isFixedDate = cos.type === 'fixed_date';
            const isDisabled = isFixedDate && !hasDueDate;

            return (
              <button
                key={cos.id}
                type="button"
                className={`${styles.item} ${isSelected ? styles.itemActive : ''} ${isDisabled ? styles.itemDisabled : ''}`}
                disabled={isDisabled}
                onClick={() => handleItemClick(cos.id)}
              >
                <div className={styles.colorSwatch} style={{ backgroundColor: cos.color }} />
                <span className={styles.itemName}>{cos.name}</span>
                {isSelected && <Icon name="check" className={styles.checkIcon} />}
                {isDisabled && (
                  <span className={styles.warning}>
                    <Icon name="warning sign" size="small" />
                    {t('common.dueDateRequired', { defaultValue: 'Due date required' })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Popup.Content>
    </>
  );
});

ClassOfServicePicker.propTypes = {
  cardId: PropTypes.string.isRequired,
  currentClassOfServiceId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onBack: PropTypes.func,
};

ClassOfServicePicker.defaultProps = {
  currentClassOfServiceId: null,
  onBack: undefined,
};

export default ClassOfServicePicker;
