/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from 'semantic-ui-react';

import styles from './CalendarToolbar.module.scss';

// 캘린더 상단 툴바: 이전/다음/오늘 네비게이션, 현재 월 라벨, 설정 버튼 (R2.4)
//
// 설정 버튼은 Planka 의 usePopup 패턴을 따른다. usePopup 은 트리거 엘리먼트를 children 으로
// 감싸 클릭 시 팝업을 띄우므로(SwimLaneHeader 등 동일 패턴), 단순 onClick 콜백이 아닌
// "팝업 래퍼 컴포넌트"를 SettingsPopup prop 으로 전달받아 설정 버튼을 감싼다. 이렇게 하면
// 팝업이 설정 버튼에 정확히 앵커링된다. SettingsPopup 이 없으면 버튼을 숨긴다.
const CalendarToolbar = React.memo(
  ({ year, month, onPrevMonth, onNextMonth, onToday, SettingsPopup }) => {
    const [t, { language }] = useTranslation();

    // 현재 월 라벨을 뷰어 로컬 로케일로 포매팅 (예: "2026년 6월" / "June 2026")
    const monthLabel = useMemo(() => {
      const date = new Date(year, month, 1);
      return new Intl.DateTimeFormat(language, {
        year: 'numeric',
        month: 'long',
      }).format(date);
    }, [year, month, language]);

    return (
      <div className={styles.toolbar}>
        <div className={styles.navGroup}>
          <Button
            icon
            type="button"
            className={styles.navButton}
            aria-label={t('action.previous', { defaultValue: 'Previous' })}
            title={t('action.previous', { defaultValue: 'Previous' })}
            onClick={onPrevMonth}
          >
            <Icon fitted name="angle left" />
          </Button>
          <Button type="button" className={styles.todayButton} onClick={onToday}>
            {t('common.today', { defaultValue: 'Today' })}
          </Button>
          <Button
            icon
            type="button"
            className={styles.navButton}
            aria-label={t('action.next', { defaultValue: 'Next' })}
            title={t('action.next', { defaultValue: 'Next' })}
            onClick={onNextMonth}
          >
            <Icon fitted name="angle right" />
          </Button>
        </div>

        <div className={styles.monthLabel}>{monthLabel}</div>

        <div className={styles.actionsGroup}>
          {SettingsPopup && (
            <SettingsPopup>
              <Button
                icon
                type="button"
                className={styles.navButton}
                aria-label={t('common.calendarSettings_title', {
                  defaultValue: 'Calendar Settings',
                })}
                title={t('common.calendarSettings_title', { defaultValue: 'Calendar Settings' })}
              >
                <Icon fitted name="setting" />
              </Button>
            </SettingsPopup>
          )}
        </div>
      </div>
    );
  },
);

CalendarToolbar.propTypes = {
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired, // 0-indexed (JS Date 규약)
  onPrevMonth: PropTypes.func.isRequired,
  onNextMonth: PropTypes.func.isRequired,
  onToday: PropTypes.func.isRequired,
  SettingsPopup: PropTypes.elementType,
};

CalendarToolbar.defaultProps = {
  SettingsPopup: undefined,
};

export default CalendarToolbar;
