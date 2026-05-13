/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * auto-resolve.js
 *
 * @description :: 카드 완료 시 연결된 활성 블로커를 자동으로 resolved 처리하는 헬퍼
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

    // 2. 각 연결된 활성 블로커에 대해 자동 해결 조건 확인
    await Promise.all(
      blockerIds.map(async (blockerId) => {
        const blocker = await Blocker.qm.getOneById(blockerId);

        // 활성 블로커만 처리
        if (!blocker || blocker.status !== Blocker.Statuses.ACTIVE) {
          return;
        }

        // 해당 블로커의 모든 연결 카드 조회
        const allLinkedCards = await BlockerLinkedCard.qm.getByBlockerId(blockerId);

        // 연결 카드 0개인 블로커는 자동 해결 대상 제외
        if (allLinkedCards.length === 0) {
          return;
        }

        // 모든 연결 카드의 completedAt 확인
        const cards = await Promise.all(
          allLinkedCards.map((link) => Card.qm.getOneById(link.cardId)),
        );

        // 삭제된 카드가 있으면 해결하지 않음
        const allCompleted = cards.every((card) => card && card.completedAt);

        if (!allCompleted) {
          return;
        }

        // 모든 카드 완료 시 블로커를 resolved로 업데이트
        const updatedBlocker = await Blocker.qm.updateOne(blocker.id, {
          status: Blocker.Statuses.RESOLVED,
          resolvedAt: new Date().toISOString(),
        });

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
