/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * detect-commitment-point-crossing.js
 *
 * @description :: 카드 이동 시 Commitment Point 경계 통과를 감지하고 기록하는 헬퍼
 */

const { Directions } = require('../../models/CardCommitmentLog');
const { Types: CommitmentPointTypes } = require('../../models/CommitmentPoint');

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
    fromList: {
      type: 'ref',
      required: true,
    },
    toList: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const { card, board, fromList, toList } = inputs;

    // 보드의 모든 Commitment Point 조회
    const commitmentPoints = await CommitmentPoint.qm.getByBoardId(board.id);

    if (commitmentPoints.length === 0) {
      return [];
    }

    // 보드의 모든 리스트 조회 (position 기준 정렬)
    const lists = await List.qm.getByBoardId(board.id, {
      typeOrTypes: List.FINITE_TYPES,
      sort: ['position', 'id'],
    });

    // 리스트 position 맵 생성
    const listPositionMap = {};
    lists.forEach((list) => {
      listPositionMap[list.id] = list.position;
    });

    const fromPosition = listPositionMap[fromList.id];
    const toPosition = listPositionMap[toList.id];

    // position 정보가 없으면 처리 불가
    if (_.isUndefined(fromPosition) || _.isUndefined(toPosition)) {
      return [];
    }

    const now = new Date();
    const createdLogs = [];
    let hasForwardDeliveryCrossing = false;
    let hasBackwardDeliveryCrossing = false;

    // 각 Commitment Point에 대해 통과 여부 판별
    // eslint-disable-next-line no-restricted-syntax
    for (const cp of commitmentPoints) {
      const leftListPosition = listPositionMap[cp.leftListId];
      const rightListPosition = listPositionMap[cp.rightListId];

      // CP의 리스트 position 정보가 없으면 건너뜀
      if (_.isUndefined(leftListPosition) || _.isUndefined(rightListPosition)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // fromList가 CP 이전(왼쪽)에 있는지: position <= leftList.position
      const fromIsBeforeCp = fromPosition <= leftListPosition;
      // toList가 CP 이후(오른쪽)에 있는지: position >= rightList.position
      const toIsAfterCp = toPosition >= rightListPosition;

      // fromList가 CP 이후(오른쪽)에 있는지: position >= rightList.position
      const fromIsAfterCp = fromPosition >= rightListPosition;
      // toList가 CP 이전(왼쪽)에 있는지: position <= leftList.position
      const toIsBeforeCp = toPosition <= leftListPosition;

      let direction = null;

      if (fromIsBeforeCp && toIsAfterCp) {
        // 정방향 통과: CP 이전 → CP 이후
        direction = Directions.FORWARD;
      } else if (fromIsAfterCp && toIsBeforeCp) {
        // 역방향 통과: CP 이후 → CP 이전
        direction = Directions.BACKWARD;
      }

      // 통과가 감지된 경우 기록 생성
      if (direction) {
        // eslint-disable-next-line no-await-in-loop
        const log = await CardCommitmentLog.qm.createOne({
          cardId: card.id,
          commitmentPointId: cp.id,
          direction,
          passedAt: now.toISOString(),
        });

        createdLogs.push(log);

        // Delivery Point 통과 여부 추적
        if (cp.type === CommitmentPointTypes.DELIVERY) {
          if (direction === Directions.FORWARD) {
            hasForwardDeliveryCrossing = true;
          } else if (direction === Directions.BACKWARD) {
            hasBackwardDeliveryCrossing = true;
          }
        }
      }
    }

    // Delivery Point 정방향 통과 시 card.completedAt 설정
    if (hasForwardDeliveryCrossing) {
      const completedAt = now.toISOString();
      await Card.qm.updateOne(card.id, { completedAt });

      sails.sockets.broadcast(`board:${board.id}`, 'cardUpdate', {
        item: {
          id: card.id,
          completedAt,
        },
      });

      // 이 카드가 연결된 활성 블로커 자동 해결
      await sails.helpers.blockers.autoResolve.with({
        card,
        board,
      });
    }

    // Delivery Point 역방향 통과 시 card.completedAt 초기화
    if (hasBackwardDeliveryCrossing && !hasForwardDeliveryCrossing) {
      await Card.qm.updateOne(card.id, { completedAt: null });

      sails.sockets.broadcast(`board:${board.id}`, 'cardUpdate', {
        item: {
          id: card.id,
          completedAt: null,
        },
      });
    }

    return createdLogs;
  },
};
