/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    recordOrRecords: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    let boardIdOrIds;
    if (_.isPlainObject(inputs.recordOrRecords)) {
      ({
        recordOrRecords: { id: boardIdOrIds },
      } = inputs);
    } else if (_.every(inputs.recordOrRecords, _.isPlainObject)) {
      boardIdOrIds = sails.helpers.utils.mapRecords(inputs.recordOrRecords);
    }

    const boardMemberships = await BoardMembership.qm.delete({
      boardId: boardIdOrIds,
    });

    await Label.qm.delete({
      boardId: boardIdOrIds,
    });

    const lists = await List.qm.delete({
      boardId: boardIdOrIds,
    });

    await sails.helpers.lists.deleteRelated(lists);

    // 칸반 확장 테이블 정리 (FK CASCADE 가 없어 앱 레벨에서 정리한다).
    // 카드 단위 레코드(blocker, 각종 로그)는 위 lists.deleteRelated → cards.deleteRelated 에서 정리된다.
    await CommitmentPoint.qm.delete({
      boardId: boardIdOrIds,
    });

    await BoardDailySnapshot.qm.delete({
      boardId: boardIdOrIds,
    });

    await SwimLane.qm.delete({
      boardId: boardIdOrIds,
    });

    await Action.qm.update(
      {
        boardId: boardIdOrIds,
      },
      {
        boardId: null,
      },
    );

    await NotificationService.qm.delete({
      boardId: boardIdOrIds,
    });

    return { boardMemberships };
  },
};
