/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * calculate-lead-time.js
 *
 * @description :: card_commitment_log + completed_at 기반 Lead Time 분포 계산.
 *                 Commitment Point 진입 시점부터 완료 시점까지의 경과 일수를 계산한다.
 */

const {
  parseLocalDate,
  addLocalDays,
  diffLocalCalendarDays,
} = require('../../../utils/local-date');

/**
 * 정렬된 배열에서 특정 백분위수 값을 계산한다.
 * @param {number[]} sortedValues - 오름차순 정렬된 값 배열
 * @param {number} percentile - 백분위수 (0~100)
 * @returns {number} 해당 백분위수 값
 */
function calculatePercentile(sortedValues, percentile) {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower];
  }

  const fraction = index - lower;
  return (
    Math.round(
      (sortedValues[lower] + fraction * (sortedValues[upper] - sortedValues[lower])) * 10,
    ) / 10
  );
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

    // 날짜 범위 내 완료된 카드 조회
    const cardCriteria = {
      boardId,
      completedAt: { '!=': null },
    };

    if (classOfServiceId) {
      cardCriteria.classOfServiceId = classOfServiceId;
    }

    const completedCards = await Card.find(cardCriteria);

    // 날짜 범위 필터링 (completedAt이 startDate~endDate 범위 내, 로컬 타임존 달력일 기준)
    const startMs = parseLocalDate(startDate).getTime();
    const endExclusiveMs = addLocalDays(parseLocalDate(endDate), 1).getTime();

    const filteredCards = completedCards.filter((card) => {
      const completedMs = new Date(card.completedAt).getTime();
      return completedMs >= startMs && completedMs < endExclusiveMs;
    });

    if (filteredCards.length === 0) {
      return { values: [], percentile85: 0, average: 0, median: 0 };
    }

    // 각 카드의 commitment log 조회 (배치)
    const cardIds = filteredCards.map((card) => card.id);
    const commitmentLogs = await CardCommitmentLog.qm.getByCardIds(cardIds);

    // 카드별 첫 번째 forward commitment log 매핑
    const firstForwardLogByCardId = {};
    commitmentLogs.forEach((log) => {
      if (log.direction !== CardCommitmentLog.Directions.FORWARD) {
        return;
      }

      if (
        !firstForwardLogByCardId[log.cardId] ||
        new Date(log.passedAt) < new Date(firstForwardLogByCardId[log.cardId].passedAt)
      ) {
        firstForwardLogByCardId[log.cardId] = log;
      }
    });

    // Lead Time 계산 (달력일 포함 규약, 로컬 타임존 기준)
    // 시작 기준: forward Commitment Point 통과 시점이 있으면 그 시점,
    // 없으면 카드의 startDate(태스크 컬럼 최초 진입), 그것도 없으면 createdAt 로 폴백한다.
    // (Commitment Point 미설정 보드에서도 완료 카드는 Lead Time 에 집계되도록.)
    // 일수 규약: 시작일과 완료일을 모두 포함한 달력일 수. 같은 날 완료 = 1일,
    // 어제 시작해 오늘 완료 = 2일. (경과 시간 ceil 방식은 1분 = 1일, 25시간 = 2일로 시각에 따라 흔들림)
    const values = [];
    filteredCards.forEach((card) => {
      const firstLog = firstForwardLogByCardId[card.id];
      const startDateForCard = firstLog
        ? new Date(firstLog.passedAt)
        : new Date(card.startDate || card.createdAt);

      const completedDate = new Date(card.completedAt);
      const leadTimeDays = Math.max(1, diffLocalCalendarDays(startDateForCard, completedDate) + 1);
      values.push(leadTimeDays);
    });

    if (values.length === 0) {
      return { values: [], percentile85: 0, average: 0, median: 0 };
    }

    // 통계 계산
    const sorted = [...values].sort((a, b) => a - b);
    const average = Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
    // 중위값: 짝수 표본이면 가운데 두 값의 평균 (상위값 하나만 취하면 편향됨)
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 1
        ? sorted[mid]
        : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
    const percentile85 = calculatePercentile(sorted, 85);

    return {
      values,
      percentile85,
      average,
      median,
    };
  },
};
