/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * calculate-little-law.js
 *
 * @description :: Little's Law 기반 메트릭 요약 계산.
 *                 예상 Lead Time = 평균 WIP / 일 평균 Delivery Rate
 *                 평균 WIP는 board_daily_snapshot에서 진행 중 컬럼의 일별 합계 평균으로 계산한다.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Commitment Point와 Delivery Point 사이의 리스트 ID 목록을 반환한다.
 * CP가 없으면 모든 활성 리스트를 반환한다.
 * @param {Object[]} lists - position 순서로 정렬된 리스트 배열
 * @param {Object[]} commitmentPoints - Commitment Point 배열
 * @returns {string[]} 진행 중 리스트 ID 배열
 */
function getInProgressListIds(lists, commitmentPoints) {
  if (commitmentPoints.length === 0) {
    return lists.map((list) => list.id);
  }

  const firstCommitment = commitmentPoints.find(
    (cp) => cp.type === CommitmentPoint.Types.COMMITMENT,
  );

  const lastDelivery = [...commitmentPoints]
    .reverse()
    .find((cp) => cp.type === CommitmentPoint.Types.DELIVERY);

  if (!firstCommitment) {
    return lists.map((list) => list.id);
  }

  const listIds = lists.map((list) => list.id);
  const startIdx = listIds.indexOf(firstCommitment.rightListId);
  const endIdx = lastDelivery ? listIds.indexOf(lastDelivery.leftListId) : listIds.length - 1;

  if (startIdx === -1) {
    return lists.map((list) => list.id);
  }

  const effectiveEndIdx = endIdx === -1 ? listIds.length - 1 : endIdx;
  return listIds.slice(startIdx, effectiveEndIdx + 1);
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

    // 기간 일수 계산
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const numberOfDays = Math.max(1, Math.ceil((endMs - startMs) / MS_PER_DAY) + 1);

    // 보드의 Commitment Point 조회
    const commitmentPoints = await CommitmentPoint.find({ boardId }).sort('position ASC');

    // WIP 측정 대상: 태스크 컬럼만 (백로그/완료/디스카드 제외)
    const lists = await List.find({
      boardId,
      type: List.WIP_COUNT_TYPES,
      parentListId: null,
    }).sort('position ASC');

    // 진행 중 컬럼 범위 결정
    const inProgressListIds = getInProgressListIds(lists, commitmentPoints);

    // 스냅샷 데이터 조회
    const snapshots = await BoardDailySnapshot.qm.getByBoardIdAndDateRange(
      boardId,
      startDate,
      endDate,
    );

    // 일별 WIP 합계 계산 (진행 중 컬럼만)
    const dailyWipMap = {};

    if (classOfServiceId) {
      // CoS 필터 시: 스냅샷은 CoS를 보존하지 않으므로 CardMovementLog로 시점별 listId를 재구성
      const cosCards = await Card.find({ boardId, classOfServiceId });
      const cosCardIds = cosCards.map((c) => c.id);
      const movements =
        cosCardIds.length > 0
          ? await CardMovementLog.find({
              cardId: cosCardIds,
              boardId,
            }).sort('movedAt ASC')
          : [];

      const movementsByCard = {};
      movements.forEach((m) => {
        if (!movementsByCard[m.cardId]) movementsByCard[m.cardId] = [];
        movementsByCard[m.cardId].push(m);
      });

      const dateStrs = new Set(
        snapshots.map((s) =>
          typeof s.snapshotDate === 'string'
            ? s.snapshotDate.split('T')[0]
            : new Date(s.snapshotDate).toISOString().split('T')[0],
        ),
      );

      dateStrs.forEach((dateStr) => {
        const endOfDayMs = new Date(`${dateStr}T23:59:59.999Z`).getTime();
        let count = 0;
        cosCards.forEach((card) => {
          if (new Date(card.createdAt).getTime() > endOfDayMs) return;
          if (card.completedAt && new Date(card.completedAt).getTime() < endOfDayMs) return;

          const cardMoves = movementsByCard[card.id] || [];
          let { listId } = card;
          for (let i = cardMoves.length - 1; i >= 0; i -= 1) {
            if (new Date(cardMoves[i].movedAt).getTime() <= endOfDayMs) {
              listId = cardMoves[i].toListId || listId;
              break;
            }
          }

          if (inProgressListIds.includes(listId)) {
            count += 1;
          }
        });
        dailyWipMap[dateStr] = count;
      });
    } else {
      snapshots.forEach((snapshot) => {
        if (!inProgressListIds.includes(snapshot.listId)) {
          return;
        }

        const dateStr =
          typeof snapshot.snapshotDate === 'string'
            ? snapshot.snapshotDate.split('T')[0]
            : new Date(snapshot.snapshotDate).toISOString().split('T')[0];

        if (!dailyWipMap[dateStr]) {
          dailyWipMap[dateStr] = 0;
        }
        dailyWipMap[dateStr] += snapshot.cardCount;
      });
    }

    // 평균 WIP 계산
    const dailyWipValues = Object.values(dailyWipMap);
    const averageWip =
      dailyWipValues.length > 0
        ? Math.round((dailyWipValues.reduce((sum, v) => sum + v, 0) / dailyWipValues.length) * 10) /
          10
        : 0;

    // Delivery Rate 계산 (기간 내 완료 카드 수 / 일수)
    const completedCriteria = {
      boardId,
      completedAt: { '!=': null },
    };
    if (classOfServiceId) {
      completedCriteria.classOfServiceId = classOfServiceId;
    }
    const completedCards = await Card.find(completedCriteria);

    const filteredCompleted = completedCards.filter((card) => {
      const completedMs = new Date(card.completedAt).getTime();
      return completedMs >= startMs && completedMs <= endMs + MS_PER_DAY;
    });

    const deliveryRate = Math.round((filteredCompleted.length / numberOfDays) * 100) / 100;

    // 예상 Lead Time = 평균 WIP / Delivery Rate
    const expectedLeadTime =
      deliveryRate > 0 ? Math.round((averageWip / deliveryRate) * 10) / 10 : 0;

    return {
      averageWip,
      deliveryRate,
      expectedLeadTime,
    };
  },
};
