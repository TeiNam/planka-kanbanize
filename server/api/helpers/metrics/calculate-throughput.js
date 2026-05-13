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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * 주어진 날짜가 속한 ISO 주의 월요일 날짜를 반환한다.
 * ISO 8601: 주의 시작은 월요일
 * @param {Date} date - 대상 날짜
 * @returns {Date} 해당 주의 월요일 날짜 (시간은 00:00:00 UTC)
 */
function getIsoWeekStart(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);

  // getUTCDay(): 0=일, 1=월, ..., 6=토
  const dayOfWeek = d.getUTCDay();
  // ISO 주 시작은 월요일 (1), 일요일(0)은 이전 주에 속함
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setUTCDate(d.getUTCDate() + diff);

  return d;
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

    // 날짜 범위 필터링
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + MS_PER_DAY;

    const filteredCards = completedCards.filter((card) => {
      const completedMs = new Date(card.completedAt).getTime();
      return completedMs >= startMs && completedMs < endMs;
    });

    if (filteredCards.length === 0) {
      return { weeks: [], average: 0 };
    }

    // ISO 주 단위로 그룹핑
    const weekMap = {};
    filteredCards.forEach((card) => {
      const weekStart = getIsoWeekStart(new Date(card.completedAt));
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = 0;
      }
      weekMap[weekKey] += 1;
    });

    // 주 단위 정렬
    const weeks = Object.keys(weekMap)
      .sort()
      .map((weekStart) => ({
        weekStart,
        count: weekMap[weekStart],
      }));

    // 평균 Throughput 계산
    const totalCount = weeks.reduce((sum, week) => sum + week.count, 0);
    const average = Math.round((totalCount / weeks.length) * 10) / 10;

    return {
      weeks,
      average,
    };
  },
};
