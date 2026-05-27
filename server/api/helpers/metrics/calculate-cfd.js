/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * calculate-cfd.js
 *
 * @description :: board_daily_snapshot 기반 CFD(Cumulative Flow Diagram) 데이터 조회.
 *                 날짜별 각 컬럼의 누적 카드 수를 반환한다.
 */

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

    // 해당 보드의 칸반 리스트 조회 (백로그/태스크/완료/디스카드)
    const lists = await List.find({
      boardId,
      type: List.KANBAN_TYPES,
      parentListId: null,
    }).sort('position ASC');

    // 스냅샷 데이터 조회
    const snapshots = await BoardDailySnapshot.find({
      boardId,
      snapshotDate: { '>=': startDate, '<=': endDate },
    }).sort('snapshotDate ASC');

    // CoS 필터: 스냅샷은 CoS를 보존하지 않으므로 CardMovementLog로 시점별 listId를 재구성한다.
    // 추정 로직 단순화: 카드별 movement 이력에서 endOfDay 이전 마지막 toListId를 사용한다.
    const dateMap = {};
    const collectedDates = new Set(
      snapshots.map((s) =>
        typeof s.snapshotDate === 'string'
          ? s.snapshotDate.split('T')[0]
          : new Date(s.snapshotDate).toISOString().split('T')[0],
      ),
    );

    if (classOfServiceId) {
      const cards = await Card.find({ boardId, classOfServiceId });
      const cardIds = cards.map((c) => c.id);
      const listIds = lists.map((l) => l.id);

      const movements =
        cardIds.length > 0
          ? await CardMovementLog.find({
              cardId: cardIds,
              boardId,
            }).sort('movedAt ASC')
          : [];

      const movementsByCard = {};
      movements.forEach((m) => {
        if (!movementsByCard[m.cardId]) movementsByCard[m.cardId] = [];
        movementsByCard[m.cardId].push(m);
      });

      collectedDates.forEach((dateStr) => {
        const endOfDayMs = new Date(`${dateStr}T23:59:59.999Z`).getTime();
        const counts = {};
        cards.forEach((card) => {
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

          if (listIds.includes(listId)) {
            counts[listId] = (counts[listId] || 0) + 1;
          }
        });
        dateMap[dateStr] = counts;
      });
    } else {
      snapshots.forEach((snapshot) => {
        const date =
          typeof snapshot.snapshotDate === 'string'
            ? snapshot.snapshotDate.split('T')[0]
            : new Date(snapshot.snapshotDate).toISOString().split('T')[0];
        if (!dateMap[date]) {
          dateMap[date] = {};
        }
        dateMap[date][snapshot.listId] = snapshot.cardCount;
      });
    }

    // 날짜 목록 생성
    const dates = Object.keys(dateMap).sort();

    // 리스트별 데이터 구성
    const listData = lists.map((list) => ({
      listId: list.id,
      name: list.name,
      counts: dates.map((date) => dateMap[date][list.id] || 0),
    }));

    return {
      dates,
      lists: listData,
    };
  },
};
