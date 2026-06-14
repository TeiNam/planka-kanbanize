/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Message } from 'semantic-ui-react';

import api from '../../api';
import selectors from '../../selectors';
import Paths from '../../constants/Paths';
import { push } from '../../lib/redux-router';
import { usePopup } from '../../lib/popup';
import { CalendarEventKinds } from '../../constants/Enums';
import {
  generateMonthGrid,
  getAllDayDateKeys,
  getLocalDateKey,
  getAllDayDateKey,
  groupByDateKey,
} from '../../utils/calendar';
import CalendarToolbar from './CalendarToolbar';
import CalendarGrid from './CalendarGrid';
import CalendarSettingsPopup from './CalendarSettingsPopup';

import styles from './CalendarContent.module.scss';

// 연/월(0-indexed)로 캐시 키 생성 (예: 2026-5 → "2026-6")
const getYearMonthKey = (year, month) => `${year}-${month + 1}`;

const CalendarContent = React.memo(({ projectId }) => {
  const [t, { language }] = useTranslation();

  const dispatch = useDispatch();

  // 선택된 월 상태. 최초 표시 시 현재 달로 초기화한다 (R2.5).
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { year, month } = selectedMonth;

  // 공휴일은 redux-orm 등 영속 저장소에 두지 않고 컴포넌트 로컬 휘발성 상태로만 보관한다 (R10.4/R11.2).
  // ymKey(연-월) → holidays[] 형태이며, 미설정/실패 시 즉시 비운다.
  const [holidaysByYearMonth, setHolidaysByYearMonth] = useState({});
  const [holidayError, setHolidayError] = useState(false);

  const project = useSelector(selectors.selectCurrentProject);
  const calendarEvents = useSelector(selectors.selectCalendarEventsForCurrentProject);
  const dueDateCards = useSelector(selectors.selectDueDateCardsForCurrentProject);
  const accessToken = useSelector(selectors.selectAccessToken);

  const holidayApiEndpoint = project ? project.holidayApiEndpoint : null;

  // 비동기 응답이 월/엔드포인트 변경 이후 늦게 도착했을 때 stale 결과 반영을 막기 위한 요청 토큰.
  const requestTokenRef = useRef(0);

  // 월 그리드(일요일 시작, 월 경계 채움) — year/month 변경 시에만 재계산 (R2.1, R2.2)
  const weeks = useMemo(() => generateMonthGrid(year, month), [year, month]);

  // ── 공휴일 조회 (R10.1/R10.5) + 캐시 금지 정책 (R10.4/R11.2) ──────────────
  useEffect(() => {
    const yearMonthKey = getYearMonthKey(year, month);

    // 엔드포인트 미설정/빈 문자열 → 공휴일을 표시하지 않고 항상 비운다 (R10.4).
    if (!holidayApiEndpoint) {
      requestTokenRef.current += 1;
      setHolidayError(false);
      setHolidaysByYearMonth((prev) =>
        prev[yearMonthKey] ? { ...prev, [yearMonthKey]: [] } : prev,
      );
      return undefined;
    }

    requestTokenRef.current += 1;
    const requestToken = requestTokenRef.current;
    let isCancelled = false;

    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

    // 서버 규약상 month 는 1~12 (컴포넌트 상태는 0-indexed 이므로 +1).
    api
      .fetchHolidays(projectId, { year, month: month + 1 }, headers)
      .then((response) => {
        // 늦게 도착한 stale 응답은 무시한다 (월/엔드포인트가 이미 바뀐 경우).
        if (isCancelled || requestToken !== requestTokenRef.current) {
          return;
        }

        const items = (response && response.items) || [];
        setHolidayError(false);
        setHolidaysByYearMonth((prev) => ({ ...prev, [yearMonthKey]: items }));
      })
      .catch(() => {
        if (isCancelled || requestToken !== requestTokenRef.current) {
          return;
        }

        // 조회 실패: 해당 월 공휴일 표시 비움 + 이전 캐시 제거 (R11.2) 후 비차단 알림 (R11.3).
        setHolidaysByYearMonth((prev) => ({ ...prev, [yearMonthKey]: [] }));
        setHolidayError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId, year, month, holidayApiEndpoint, accessToken]);

  // 네비게이션 핸들러 (R2.4): 이전/다음/오늘
  const handlePrevMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const date = new Date(prev.year, prev.month - 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const date = new Date(prev.year, prev.month + 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }, []);

  const handleToday = useCallback(() => {
    const now = new Date();
    setSelectedMonth({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  // 마감일 카드 클릭 → 해당 카드 모달을 연다(R8.3). 카드 라우트로 이동하는 기존 메커니즘
  // (dispatch(push(Paths.CARDS...)))을 그대로 재사용한다.
  const handleDueDateClick = useCallback(
    (cardId) => {
      dispatch(push(Paths.CARDS.replace(':id', cardId)));
    },
    [dispatch],
  );

  // ── 날짜키별 그룹핑 ──────────────────────────────────────────────────────
  // all-day 일정은 UTC date 경계로(다일은 범위 확장), time-based 일정은 로컬 date 로 셀 배치한다.
  const eventsByDateKey = useMemo(() => {
    if (!calendarEvents) {
      return {};
    }

    return groupByDateKey(calendarEvents, (event) => {
      if (event.eventKind === CalendarEventKinds.ALL_DAY) {
        return getAllDayDateKeys(event.startAt, event.endAt);
      }

      return getLocalDateKey(event.startAt);
    });
  }, [calendarEvents]);

  // 마감일 카드는 dueDate 기준(날짜 경계)으로 그룹핑한다 (R8.1). 셀렉터가 현재 보드 카드에서
  // 매번 파생하므로 dueDate 추가/변경/제거가 즉시 반영된다 (R8.7 / Correctness Property 4).
  const dueDatesByDateKey = useMemo(() => {
    if (!dueDateCards) {
      return {};
    }

    return groupByDateKey(dueDateCards, (card) => getAllDayDateKey(card.dueDate));
  }, [dueDateCards]);

  // 현재 월의 공휴일만 날짜키별로 그룹핑한다 (R10.2). 휘발성 상태 + 미설정/실패 시 빈 집합 (R10.4/R11.2).
  const holidaysByDateKey = useMemo(() => {
    const currentHolidays = holidaysByYearMonth[getYearMonthKey(year, month)] || [];
    return groupByDateKey(currentHolidays, (holiday) => holiday.date);
  }, [holidaysByYearMonth, year, month]);

  // 캘린더 설정(공휴일 API 주소) 팝업. usePopup 으로 래핑해 툴바의 설정 버튼에 앵커링한다 (R9.1).
  const SettingsPopup = usePopup(CalendarSettingsPopup);

  return (
    <div className={styles.wrapper}>
      <CalendarToolbar
        year={year}
        month={month}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        SettingsPopup={SettingsPopup}
      />

      {holidayError && (
        <Message
          warning
          className={styles.holidayNotice}
          content={t('common.holidayInformationUnavailable', {
            defaultValue: 'Holiday information is currently unavailable.',
          })}
        />
      )}

      <CalendarGrid
        weeks={weeks}
        eventsByDateKey={eventsByDateKey}
        dueDatesByDateKey={dueDatesByDateKey}
        holidaysByDateKey={holidaysByDateKey}
        language={language}
        onDueDateClick={handleDueDateClick}
      />
    </div>
  );
});

CalendarContent.propTypes = {
  projectId: PropTypes.string.isRequired,
};

export default CalendarContent;
