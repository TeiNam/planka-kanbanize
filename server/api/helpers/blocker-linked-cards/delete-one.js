/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    record: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const blockerLinkedCard = await BlockerLinkedCard.qm.deleteOne(inputs.record.id);

    if (blockerLinkedCard) {
      sails.sockets.broadcast(
        `board:${inputs.board.id}`,
        'blockerLinkedCardDelete',
        {
          item: blockerLinkedCard,
        },
        inputs.request,
      );

      // 링크 삭제 후 블로커 자동 해결 조건을 재평가한다.
      // 유일하게 남아 있던 미완료 링크 카드를 삭제하면, 재평가 없이는 남은 카드가
      // 전부 완료 상태여도 블로커가 ACTIVE 로 남는다 (완료 이벤트가 다시 오지 않으므로).
      // 규칙은 auto-resolve 와 동일: 링크가 1개 이상 남고 전부 완료일 때만 해결.
      // 링크가 0개가 되면 수동 블로커로 간주해 자동 해결하지 않는다.
      const blocker = await Blocker.qm.getOneById(blockerLinkedCard.blockerId);

      if (blocker && blocker.status === Blocker.Statuses.ACTIVE) {
        const remainingLinks = await BlockerLinkedCard.qm.getByBlockerId(blocker.id);

        if (remainingLinks.length > 0) {
          const cards = await Card.qm.getByIds(remainingLinks.map((link) => link.cardId));
          const cardById = {};
          cards.forEach((card) => {
            cardById[card.id] = card;
          });

          const allCompleted = remainingLinks.every((link) => {
            const card = cardById[link.cardId];
            return card && card.completedAt;
          });

          if (allCompleted) {
            // 조건부 UPDATE 로 동시 실행 시에도 한 번만 전환된다 (auto-resolve 와 동일 패턴)
            const updatedBlocker = await Blocker.qm.updateOne(
              { id: blocker.id, status: Blocker.Statuses.ACTIVE },
              {
                status: Blocker.Statuses.RESOLVED,
                resolvedAt: new Date().toISOString(),
              },
            );

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
          }
        }
      }
    }

    return blockerLinkedCard;
  },
};
