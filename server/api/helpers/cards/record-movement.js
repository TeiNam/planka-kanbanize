/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * record-movement.js
 *
 * @description :: 카드 이동 시 이력 기록 및 WIP 초과 여부 검증 헬퍼
 *                 card_movement_log에 이동 기록을 남기고,
 *                 대상 컬럼의 WIP 제한 초과 여부를 소프트 제한으로 반환한다.
 */

module.exports = {
  inputs: {
    card: {
      type: 'ref',
      required: true,
      description: '이동 대상 카드',
    },
    board: {
      type: 'ref',
      required: true,
      description: '카드가 속한 보드',
    },
    fromList: {
      type: 'ref',
      description: '출발 컬럼 (신규 카드인 경우 null)',
    },
    toList: {
      type: 'ref',
      required: true,
      description: '도착 컬럼',
    },
    fromSwimLane: {
      type: 'ref',
      description: '출발 스윔레인 (nullable)',
    },
    toSwimLane: {
      type: 'ref',
      description: '도착 스윔레인 (nullable)',
    },
    user: {
      type: 'ref',
      description: '이동을 수행한 사용자',
    },
  },

  async fn(inputs) {
    // 1. card_movement_log 기록 생성
    const movementLog = await CardMovementLog.qm.createOne({
      cardId: inputs.card.id,
      boardId: inputs.board.id,
      fromListId: inputs.fromList ? inputs.fromList.id : null,
      toListId: inputs.toList.id,
      fromSwimLaneId: inputs.fromSwimLane ? inputs.fromSwimLane.id : null,
      toSwimLaneId: inputs.toSwimLane ? inputs.toSwimLane.id : null,
      userId: inputs.user ? inputs.user.id : null,
      movedAt: new Date().toISOString(),
    });

    // 2. 대상 컬럼의 WIP 제한 확인
    const { wipLimit } = inputs.toList;
    let wipExceeded = false;
    let currentCount = 0;

    if (wipLimit) {
      // 대상 컬럼의 현재 카드 수 조회 (position이 있는 카드만 = 활성 카드)
      currentCount = await Card.count({
        listId: inputs.toList.id,
        position: { '!=': null },
      });

      // 현재 카드 수가 WIP 제한을 초과하는지 판단
      wipExceeded = currentCount > wipLimit;
    }

    return {
      movementLog,
      wipExceeded,
      currentCount,
      wipLimit: wipLimit || null,
    };
  },
};
