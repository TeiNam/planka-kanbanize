/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * calculate-throughput.js
 *
 * @description :: 주 단위 완료 건수(Throughput) 계산.
 *                 날짜 범위 내 완료된 카드를 ISO 주 단위로 그룹핑하여 반환한다.
 */

const {
  formatLocalDate,
  parseLocalDate,
  startOfLocalDay,
  addLocalDays,
} = require('../../../utils/local-date');

/**
 * 주어진 날짜가 속한 ISO 주의 월요일(로컬 타임존 자정)을 반환한다.
 * ISO 8601: 주의 시작은 월요일
 * @param {Date} date - 대상 날짜
 * @returns {Date} 해당 주의 월요일 (로컬 자정)
 */
function getIsoWeekStart(date) {
  const d = startOfLocalDay(date);

  // getDay(): 0=일, 1=월, ..., 6=토
  const dayOfWeek = d.getDay();
  // ISO 주 시작은 월요일 (1), 일요일(0)은 이전 주에 속함
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addLocalDays(d, diff);
}

module.exports = {
  inputs: {
    boardId: {
      type: 'string',
      required: true,
    },
    startDate: {
      type: 'string',
      required: true,
    },
    endDate: {
      type: 'string',
      required: true,
    },
    classOfServiceId: {
      type: 'string',
      allowNull: true,
    },
  },

  async fn(inputs) {
    const { boardId, startDate, endDate, classOfServiceId } = inputs;

    // 완료된 카드 조회
    const cardCriteria = {
      boardId,
      completedAt: { '!=': null },
    };

    if (classOfServiceId) {
      cardCriteria.classOfServiceId = classOfServiceId;
    }

    const completedCards = await Card.find(cardCriteria);

    // 날짜 범위 필터링 (로컬 타임존 달력일 기준)
    const startMs = parseLocalDate(startDate).getTime();
    const endExclusiveMs = addLocalDays(parseLocalDate(endDate), 1).getTime();

    const filteredCards = completedCards.filter((card) => {
      const completedMs = new Date(card.completedAt).getTime();
      return completedMs >= startMs && completedMs < endExclusiveMs;
    });

    if (filteredCards.length === 0) {
      return { weeks: [], average: 0 };
    }

    // ISO 주 단위로 그룹핑 (로컬 타임존)
    const weekMap = {};
    filteredCards.forEach((card) => {
      const weekStart = getIsoWeekStart(new Date(card.completedAt));
      const weekKey = formatLocalDate(weekStart);

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = 0;
      }
      weekMap[weekKey] += 1;
    });

    // 요청 범위의 모든 주를 0건 포함으로 나열한다.
    // 완료가 있는 주만 세면 0건 주가 평균 분모에서 빠져 Throughput 이 과대 산출된다.
    const weeks = [];
    const lastWeekStart = getIsoWeekStart(parseLocalDate(endDate));
    for (
      let weekStart = getIsoWeekStart(parseLocalDate(startDate));
      weekStart.getTime() <= lastWeekStart.getTime();
      weekStart = addLocalDays(weekStart, 7)
    ) {
      const weekKey = formatLocalDate(weekStart);
      weeks.push({
        weekStart: weekKey,
        count: weekMap[weekKey] || 0,
      });
    }

    // 평균 Throughput 계산 (0건 주 포함)
    const totalCount = weeks.reduce((sum, week) => sum + week.count, 0);
    const average = weeks.length > 0 ? Math.round((totalCount / weeks.length) * 10) / 10 : 0;

    return {
      weeks,
      average,
    };
  },
};
