/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * auto-resolve.js
 *
 * @description :: 카드 완료 시 연결된 활성 블로커를 자동으로 resolved 처리하는 헬퍼.
 *                 블로커의 모든 연결 카드가 완료 상태면 해당 블로커를 resolved 로 바꾼다.
 */

module.exports = {
  inputs: {
    card: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    // 1. card_id로 blocker_linked_card 조회하여 관련 블로커 연결 목록 획득
    const linkedCards = await BlockerLinkedCard.qm.getByCardId(inputs.card.id);

    if (linkedCards.length === 0) {
      return;
    }

    // 고유한 블로커 ID 추출
    const blockerIds = [...new Set(linkedCards.map((link) => link.blockerId))];

    // 2. 관련 데이터를 블로커/링크/카드 단위로 각각 1회씩 일괄 조회한다.
    //    (블로커마다 순차 조회하면 블로커 수 x 링크 수만큼 쿼리가 늘어난다 — N+1)
    const blockers = await Blocker.qm.getByIds(blockerIds);
    const activeBlockers = blockers.filter((blocker) => blocker.status === Blocker.Statuses.ACTIVE);

    if (activeBlockers.length === 0) {
      return;
    }

    const allLinkedCards = await BlockerLinkedCard.qm.getByBlockerIds(
      activeBlockers.map((blocker) => blocker.id),
    );

    const linksByBlockerId = {};
    allLinkedCards.forEach((link) => {
      if (!linksByBlockerId[link.blockerId]) {
        linksByBlockerId[link.blockerId] = [];
      }
      linksByBlockerId[link.blockerId].push(link);
    });

    const cardIds = [...new Set(allLinkedCards.map((link) => link.cardId))];
    const cards = cardIds.length > 0 ? await Card.qm.getByIds(cardIds) : [];

    const cardById = {};
    cards.forEach((card) => {
      cardById[card.id] = card;
    });

    // 3. 자동 해결 조건 확인 후 조건부 UPDATE 로 원자적으로 전환한다.
    await Promise.all(
      activeBlockers.map(async (blocker) => {
        const links = linksByBlockerId[blocker.id] || [];

        // 연결 카드 0개인 블로커는 자동 해결 대상 제외
        if (links.length === 0) {
          return;
        }

        // 모든 연결 카드가 존재하고 완료 상태인지 확인 (삭제된 카드가 있으면 해결하지 않음)
        const allCompleted = links.every((link) => {
          const card = cardById[link.cardId];
          return card && card.completedAt;
        });

        if (!allCompleted) {
          return;
        }

        // status: ACTIVE 를 조건에 포함한 단일 UPDATE 로 처리해
        // 동시 실행(카드 두 장이 같은 순간 완료되는 경우 등)에도 한 번만 전환/브로드캐스트된다.
        const updatedBlocker = await Blocker.qm.updateOne(
          { id: blocker.id, status: Blocker.Statuses.ACTIVE },
          {
            status: Blocker.Statuses.RESOLVED,
            resolvedAt: new Date().toISOString(),
          },
        );

        // WebSocket 브로드캐스트 (blockerUpdate)
        if (updatedBlocker) {
          sails.sockets.broadcast(
            `board:${inputs.board.id}`,
            'blockerUpdate',
            {
              item: updatedBlocker,
            },
            inputs.request,
          );
        }
      }),
    );
  },
};
