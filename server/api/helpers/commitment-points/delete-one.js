/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const MIN_COMMITMENT_POINTS_PER_BOARD = 2;

module.exports = {
  inputs: {
    record: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    board: {
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

  exits: {
    minCommitmentPointsRequired: {},
  },

  async fn(inputs) {
    // 보드당 최소 2개 유지 검증: 2개 이하인 경우 삭제하면 1개가 남게 되어 차단.
    // 0개로 초기화된 상태(아직 미사용)는 허용한다.
    const existingPoints = await CommitmentPoint.qm.getByBoardId(inputs.board.id);
    if (existingPoints.length >= MIN_COMMITMENT_POINTS_PER_BOARD &&
        existingPoints.length - 1 < MIN_COMMITMENT_POINTS_PER_BOARD) {
      throw 'minCommitmentPointsRequired';
    }

    // 기존 card_commitment_log 기록은 보존 (cascade delete 하지 않음)
    const commitmentPoint = await CommitmentPoint.qm.deleteOne(inputs.record.id);

    if (commitmentPoint) {
      sails.sockets.broadcast(
        `board:${commitmentPoint.boardId}`,
        'commitmentPointDelete',
        {
          item: commitmentPoint,
        },
        inputs.request,
      );
    }

    return commitmentPoint;
  },
};
