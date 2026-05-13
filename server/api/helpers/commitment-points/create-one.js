/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const MAX_COMMITMENT_POINTS_PER_BOARD = 5;

module.exports = {
  inputs: {
    values: {
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

  exits: {
    maxCommitmentPointsReached: {},
    leftListNotFound: {},
    rightListNotFound: {},
    listsNotAdjacent: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    // 보드당 최대 5개 제한 검증
    const existingPoints = await CommitmentPoint.qm.getByBoardId(values.board.id);

    if (existingPoints.length >= MAX_COMMITMENT_POINTS_PER_BOARD) {
      throw 'maxCommitmentPointsReached';
    }

    // left_list_id, right_list_id 유효성 검증
    const leftList = await List.qm.getOneById(values.leftListId, {
      boardId: values.board.id,
    });

    if (!leftList) {
      throw 'leftListNotFound';
    }

    const rightList = await List.qm.getOneById(values.rightListId, {
      boardId: values.board.id,
    });

    if (!rightList) {
      throw 'rightListNotFound';
    }

    // left_list_id의 position이 right_list_id보다 작아야 함 (인접 검증)
    if (leftList.position >= rightList.position) {
      throw 'listsNotAdjacent';
    }

    // position 계산 및 삽입
    const { position, repositions } = sails.helpers.utils.insertToPositionables(
      values.position,
      existingPoints,
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const reposition of repositions) {
      // eslint-disable-next-line no-await-in-loop
      await CommitmentPoint.qm.updateOne(
        {
          id: reposition.record.id,
          boardId: reposition.record.boardId,
        },
        {
          position: reposition.position,
        },
      );

      sails.sockets.broadcast(`board:${values.board.id}`, 'commitmentPointUpdate', {
        item: {
          id: reposition.record.id,
          position: reposition.position,
        },
      });
    }

    const commitmentPoint = await CommitmentPoint.qm.createOne({
      position,
      label: values.label || null,
      type: values.type || CommitmentPoint.Types.COMMITMENT,
      boardId: values.board.id,
      leftListId: values.leftListId,
      rightListId: values.rightListId,
    });

    sails.sockets.broadcast(
      `board:${commitmentPoint.boardId}`,
      'commitmentPointCreate',
      {
        item: commitmentPoint,
      },
      inputs.request,
    );

    return commitmentPoint;
  },
};
