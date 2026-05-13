/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * calculate-wip-aging.js
 *
 * @description :: 현재 진행 중 카드의 컬럼별 체류 일수(WIP Aging) 계산.
 *                 Commitment Point ~ Delivery Point 사이의 카드를 대상으로 한다.
 *                 CP가 없으면 모든 활성 카드를 대상으로 한다.
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
    classOfServiceId: {
      type: 'string',
      allowNull: true,
    },
  },

  async fn(inputs) {
    const { boardId, classOfServiceId } = inputs;
    const now = new Date();

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

    if (inProgressListIds.length === 0) {
      return { lists: [] };
    }

    // 진행 중 카드 조회 (활성 카드만: position != null, completedAt == null)
    const cardCriteria = {
      boardId,
      listId: inProgressListIds,
      completedAt: null,
      position: { '!=': null },
    };

    if (classOfServiceId) {
      cardCriteria.classOfServiceId = classOfServiceId;
    }

    const cards = await Card.find(cardCriteria);

    if (cards.length === 0) {
      return { lists: [] };
    }

    // 카드별 현재 컬럼 진입 시점 계산 (card_movement_log 기반)
    const cardIds = cards.map((card) => card.id);
    const movementLogs = await CardMovementLog.find({
      cardId: cardIds,
    }).sort('movedAt DESC');

    // 카드별 마지막 이동 시점 매핑 (현재 컬럼 진입 시점)
    const lastMoveByCardId = {};
    movementLogs.forEach((log) => {
      if (!lastMoveByCardId[log.cardId]) {
        lastMoveByCardId[log.cardId] = log;
      }
    });

    // 리스트별 카드 그룹핑 및 나이 계산
    const listMap = {};
    lists.forEach((list) => {
      if (inProgressListIds.includes(list.id)) {
        listMap[list.id] = {
          listId: list.id,
          name: list.name,
          cards: [],
        };
      }
    });

    cards.forEach((card) => {
      if (!listMap[card.listId]) {
        return;
      }

      // 현재 컬럼 진입 시점: 마지막 이동 로그의 movedAt 또는 카드 생성일
      const lastMove = lastMoveByCardId[card.id];
      const entryDate = lastMove ? new Date(lastMove.movedAt) : new Date(card.createdAt);
      const ageDays = Math.max(0, Math.floor((now.getTime() - entryDate.getTime()) / MS_PER_DAY));

      listMap[card.listId].cards.push({
        cardId: card.id,
        name: card.name,
        age: ageDays,
      });
    });

    // 빈 리스트 제외하지 않고 모든 진행 중 리스트 반환
    const resultLists = inProgressListIds
      .filter((listId) => listMap[listId])
      .map((listId) => listMap[listId]);

    return { lists: resultLists };
  },
};
