/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Message } from 'semantic-ui-react';
import { Popup } from '../../lib/custom-ui';

import entryActions from '../../entry-actions';
import { useForm, useNestedRef, useSteps } from '../../hooks';
import { CalendarEventKinds } from '../../constants/Enums';
import { isComposing } from '../../utils/event-helpers';
import { getAllDayDateKey, getLocalDateKey } from '../../utils/calendar';
import ConfirmationStep from '../common/ConfirmationStep';

import styles from './CalendarEventPopup.module.scss';

const StepTypes = {
  DELETE: 'DELETE',
};

// 두 자리 0 패딩
const pad2 = (value) => String(value).padStart(2, '0');

// 'YYYY-MM-DD' 형식의 유효한 날짜 문자열인지 검사
const isValidDateString = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());

// 'HH:mm' 형식의 유효한 시각 문자열인지 검사
const isValidTimeString = (value) => /^\d{2}:\d{2}$/.test(value);

// 로컬 타임스탬프를 시각 입력값(HH:mm)으로 포맷 (time-based 표시는 뷰어 로컬 타임존, R7.6)
const formatLocalTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

// all-day 일정: 선택한 날짜를 UTC 자정 경계로 직렬화한다 (R7.5).
// 예: '2026-06-15' → '2026-06-15T00:00:00.000Z'. 로컬 자정 전송 금지.
const dateStringToUtcBoundaryIso = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
};

// time-based 일정: 날짜+시각을 사용자 로컬 wall-clock 으로 해석한 뒤 해당 순간의 ISO 로 직렬화한다 (R7.7).
// new Date(y, m, d, hh, mm) 은 로컬 타임존 기준 Date 이므로 toISOString() 이 올바른 UTC 순간을 만든다.
const localDateTimeToInstantIso = (dateString, timeString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
};

// CalendarEventPopup: 일정 생성/수정/삭제 폼.
// CalendarDayCell(날짜 클릭) / CalendarEventItem(항목 클릭)에서 usePopup 으로 래핑해 사용한다.
// - 생성 모드: event 미전달. defaultDate('YYYY-MM-DD')로 초기 날짜를 지정할 수 있다.
// - 수정 모드: 기존 event 전달. 삭제 컨트롤을 함께 노출한다(R5.1).
const CalendarEventPopup = React.memo(({ event, defaultDate, onClose }) => {
  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [step, openStep, handleBack] = useSteps();
  const [error, setError] = useState(null);

  const isEditMode = !!event;

  // 폼 초기값. 수정 모드에서는 종류에 따라 날짜키 추출 규칙이 다르다.
  // - all-day: UTC date 성분(getAllDayDateKey) — 로컬 타임존에 따라 날짜가 밀리지 않게(R7.5).
  // - time-based: 로컬 date/time 성분(getLocalDateKey/formatLocalTime) — 입력·표시는 로컬(R7.6/7.7).
  const defaultData = useMemo(() => {
    if (event) {
      const isAllDay = event.eventKind === CalendarEventKinds.ALL_DAY;
      const fallbackDate = getLocalDateKey(new Date());

      return {
        name: event.name || '',
        eventKind: event.eventKind,
        startDate:
          (isAllDay ? getAllDayDateKey(event.startAt) : getLocalDateKey(event.startAt)) ||
          fallbackDate,
        endDate:
          (isAllDay ? getAllDayDateKey(event.endAt) : getLocalDateKey(event.endAt)) || fallbackDate,
        startTime: isAllDay ? '09:00' : formatLocalTime(event.startAt) || '09:00',
        endTime: isAllDay ? '10:00' : formatLocalTime(event.endAt) || '10:00',
      };
    }

    const initialDate = defaultDate || getLocalDateKey(new Date());

    return {
      name: '',
      eventKind: CalendarEventKinds.ALL_DAY,
      startDate: initialDate,
      endDate: initialDate,
      startTime: '09:00',
      endTime: '10:00',
    };
  }, [event, defaultDate]);

  const [data, handleFieldChange, setData] = useForm(() => ({ ...defaultData }));

  const [nameFieldRef, handleNameFieldRef] = useNestedRef('inputRef');

  const isAllDay = data.eventKind === CalendarEventKinds.ALL_DAY;

  // all-day ↔ time-based 전환 (R4.2). 날짜 입력값은 유지하고 검증 오류는 초기화한다.
  const handleEventKindChange = useCallback(
    (eventKind) => {
      setData((prev) => ({ ...prev, eventKind }));
      setError(null);
    },
    [setData],
  );

  const submit = useCallback(() => {
    const name = data.name.trim();

    // 제목 필수: 비어 있으면 디스패치하지 않고 입력 필드를 선택해 재입력 유도(R3.4).
    if (!name) {
      setError('common.titleMustNotBeEmpty');
      nameFieldRef.current.select();
      return;
    }

    if (!isValidDateString(data.startDate) || !isValidDateString(data.endDate)) {
      setError('common.endCannotBeBeforeStart');
      return;
    }

    let startAtIso;
    let endAtIso;

    if (isAllDay) {
      // all-day: UTC date 경계로 직렬화하고 UTC date 기준으로 end>=start 검증(R7.5).
      startAtIso = dateStringToUtcBoundaryIso(data.startDate);
      endAtIso = dateStringToUtcBoundaryIso(data.endDate);
    } else {
      if (!isValidTimeString(data.startTime) || !isValidTimeString(data.endTime)) {
        setError('common.endCannotBeBeforeStart');
        return;
      }

      // time-based: 로컬 wall-clock 을 해당 순간(instant)으로 직렬화하고 instant 기준으로 검증(R7.7).
      startAtIso = localDateTimeToInstantIso(data.startDate, data.startTime);
      endAtIso = localDateTimeToInstantIso(data.endDate, data.endTime);
    }

    // 인라인 검증: end >= start (R3.1/4.1). 위반 시 디스패치하지 않는다.
    if (new Date(endAtIso).getTime() < new Date(startAtIso).getTime()) {
      setError('common.endCannotBeBeforeStart');
      return;
    }

    const payload = {
      name,
      eventKind: data.eventKind,
      startAt: startAtIso,
      endAt: endAtIso,
    };

    if (isEditMode) {
      dispatch(entryActions.updateCalendarEvent(event.id, payload));
    } else {
      dispatch(entryActions.createCalendarEventInCurrentProject(payload));
    }

    onClose();
  }, [data, isAllDay, isEditMode, event, nameFieldRef, dispatch, onClose]);

  const handleSubmit = useCallback(() => {
    submit();
  }, [submit]);

  // IME(한글) 조합 중 Enter 는 조합 확정용이므로 submit 으로 흘러가지 않게 가드.
  const handleNameKeyDown = useCallback(
    (keyEvent) => {
      if (keyEvent.key === 'Enter') {
        if (isComposing(keyEvent)) {
          return;
        }

        keyEvent.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const handleDeleteClick = useCallback(() => {
    openStep(StepTypes.DELETE);
  }, [openStep]);

  const handleDeleteConfirm = useCallback(() => {
    dispatch(entryActions.deleteCalendarEvent(event.id));
    onClose();
  }, [event, dispatch, onClose]);

  // 삭제 확인 스텝 (수정 모드 전용, R5.1)
  if (step && step.type === StepTypes.DELETE) {
    return (
      <ConfirmationStep
        title="common.deleteCalendarEvent"
        content="common.areYouSureYouWantToDeleteThisCalendarEvent"
        buttonContent="action.deleteCalendarEvent"
        onConfirm={handleDeleteConfirm}
        onBack={handleBack}
      />
    );
  }

  return (
    <>
      <Popup.Header>
        {t(isEditMode ? 'common.editCalendarEvent' : 'common.createCalendarEvent', {
          context: 'title',
        })}
      </Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <Form.Field>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>{t('common.title')}</label>
            <Form.Input
              ref={handleNameFieldRef}
              name="name"
              value={data.name}
              maxLength={1024}
              onKeyDown={handleNameKeyDown}
              onChange={handleFieldChange}
            />
          </Form.Field>

          <Button.Group widths={2} className={styles.kindToggle}>
            <Button
              type="button"
              active={isAllDay}
              content={t('common.allDay')}
              onClick={() => handleEventKindChange(CalendarEventKinds.ALL_DAY)}
            />
            <Button
              type="button"
              active={!isAllDay}
              content={t('common.timeBased')}
              onClick={() => handleEventKindChange(CalendarEventKinds.TIME_BASED)}
            />
          </Button.Group>

          <Form.Group widths="equal">
            <Form.Field>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>{t('common.start')}</label>
              <Form.Input
                type="date"
                name="startDate"
                value={data.startDate}
                onChange={handleFieldChange}
              />
            </Form.Field>
            {!isAllDay && (
              <Form.Field>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>{t('common.time')}</label>
                <Form.Input
                  type="time"
                  name="startTime"
                  value={data.startTime}
                  onChange={handleFieldChange}
                />
              </Form.Field>
            )}
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Field>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>{t('common.end')}</label>
              <Form.Input
                type="date"
                name="endDate"
                value={data.endDate}
                onChange={handleFieldChange}
              />
            </Form.Field>
            {!isAllDay && (
              <Form.Field>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>{t('common.time')}</label>
                <Form.Input
                  type="time"
                  name="endTime"
                  value={data.endTime}
                  onChange={handleFieldChange}
                />
              </Form.Field>
            )}
          </Form.Group>

          {error && <Message error className={styles.error} content={t(error)} />}

          <div className={styles.actions}>
            <Button
              positive
              content={t(isEditMode ? 'action.save' : 'action.createCalendarEvent')}
            />
            {isEditMode && (
              <Button
                type="button"
                content={t('action.delete')}
                className={styles.deleteButton}
                onClick={handleDeleteClick}
              />
            )}
          </div>
        </Form>
      </Popup.Content>
    </>
  );
});

CalendarEventPopup.propTypes = {
  /* eslint-disable-next-line react/forbid-prop-types */
  event: PropTypes.object,
  defaultDate: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

CalendarEventPopup.defaultProps = {
  event: undefined,
  defaultDate: undefined,
};

export default CalendarEventPopup;
