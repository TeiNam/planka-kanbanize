/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { dequal } from 'dequal';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input } from 'semantic-ui-react';
import { Popup } from '../../lib/custom-ui';

import selectors from '../../selectors';
import entryActions from '../../entry-actions';
import { useForm, useNestedRef } from '../../hooks';
import { isComposing } from '../../utils/event-helpers';

import styles from './CalendarSettingsPopup.module.scss';

// 입력된 공휴일 API 주소가 http/https 스킴의 유효한 URL인지 검사(서버 R9.4/9.7 검증과 일치).
// 빈 문자열은 "주소 지우기(clear)"로 허용한다(R9.5).
const isValidEndpoint = (value) => {
  if (value === '') {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// 캘린더 설정 팝업 콘텐츠.
// CalendarToolbar의 설정 버튼에서 usePopup(CalendarSettingsPopup)으로 래핑해 사용한다.
const CalendarSettingsPopup = React.memo(({ onClose }) => {
  const project = useSelector(selectors.selectCurrentProject);

  // 공휴일 API 주소는 프로젝트 단위 설정이며 프로젝트 관리자만 변경 가능하다(R9.6).
  // 그 외 사용자에게는 폼을 읽기 전용/비활성화 처리하여 서버 거부와 UI를 일치시킨다.
  const canEdit = useSelector(selectors.selectIsCurrentUserManagerForCurrentProject);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const defaultData = useMemo(
    () => ({
      holidayApiEndpoint: project.holidayApiEndpoint || '',
    }),
    [project.holidayApiEndpoint],
  );

  const [data, handleFieldChange] = useForm(() => ({
    ...defaultData,
  }));

  const cleanData = useMemo(
    () => ({
      ...data,
      holidayApiEndpoint: data.holidayApiEndpoint.trim(),
    }),
    [data],
  );

  const [endpointFieldRef, handleEndpointFieldRef] = useNestedRef('inputRef');

  const submit = useCallback(() => {
    // 유효하지 않은 URL이면 디스패치하지 않고 입력 필드를 선택해 재입력을 유도한다(서버 검증과 일치).
    if (!isValidEndpoint(cleanData.holidayApiEndpoint)) {
      endpointFieldRef.current.select();
      return;
    }

    // 빈 문자열이면 서버에 빈 값을 저장해 주소를 지운다(R9.5).
    dispatch(
      entryActions.updateProject(project.id, {
        holidayApiEndpoint: cleanData.holidayApiEndpoint,
      }),
    );

    onClose();
  }, [cleanData, endpointFieldRef, project.id, dispatch, onClose]);

  const handleSubmit = useCallback(() => {
    submit();
  }, [submit]);

  // IME(한글) 조합 중 Enter는 조합 확정용으로만 사용하고 submit으로 흘러가지 않게 가드.
  const handleFieldKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        if (isComposing(event)) {
          return;
        }

        event.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <>
      <Popup.Header>
        {t('common.calendarSettings', {
          context: 'title',
        })}
      </Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <div className={styles.text}>{t('common.holidayApiEndpoint')}</div>
          <Input
            fluid
            ref={handleEndpointFieldRef}
            name="holidayApiEndpoint"
            value={data.holidayApiEndpoint}
            placeholder="https://"
            maxLength={2048}
            readOnly={!canEdit}
            disabled={!canEdit}
            className={styles.field}
            onKeyDown={handleFieldKeyDown}
            onChange={handleFieldChange}
          />
          {canEdit && (
            <Button positive disabled={dequal(cleanData, defaultData)} content={t('action.save')} />
          )}
        </Form>
      </Popup.Content>
    </>
  );
});

CalendarSettingsPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default CalendarSettingsPopup;
