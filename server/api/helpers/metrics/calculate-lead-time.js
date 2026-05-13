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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

    // 날짜 범위 필터링 (completedAt이 startDate~endDate 범위 내)
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + MS_PER_DAY;

    const filteredCards = completedCards.filter((card) => {
      const completedMs = new Date(card.completedAt).getTime();
      return completedMs >= startMs && completedMs < endMs;
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

    // Lead Time 계산 (일 단위)
    const values = [];
    filteredCards.forEach((card) => {
      const firstLog = firstForwardLogByCardId[card.id];
      if (!firstLog) {
        return;
      }

      const passedAt = new Date(firstLog.passedAt).getTime();
      const completedAt = new Date(card.completedAt).getTime();
      const leadTimeDays = Math.max(0, Math.ceil((completedAt - passedAt) / MS_PER_DAY));
      values.push(leadTimeDays);
    });

    if (values.length === 0) {
      return { values: [], percentile85: 0, average: 0, median: 0 };
    }

    // 통계 계산
    const sorted = [...values].sort((a, b) => a - b);
    const average = Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
    const median = sorted[Math.floor(sorted.length / 2)];
    const percentile85 = calculatePercentile(sorted, 85);

    return {
      values,
      percentile85,
      average,
      median,
    };
  },
};
