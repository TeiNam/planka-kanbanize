/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

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
    backlogAlreadyExists: {},
    backlogMustBeLeftmost: {},
    wipLimitSumExceedsSystemLimit: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    const allLists = await sails.helpers.boards.getKanbanListsById(values.board.id);
    // 스윔레인 단위로 컬럼 스코프 (swimLaneId=null이면 일반 보드 스코프)
    const targetLaneId = _.isUndefined(values.swimLaneId) ? null : values.swimLaneId;
    const lists = allLists.filter((l) => (l.swimLaneId || null) === targetLaneId);

    // backlog 유일성 검증: 같은 레인 최상위에 backlog가 이미 있으면 차단
    if (values.type === List.Types.BACKLOG) {
      const existingBacklog = lists.find(
        (l) => l.parentListId === null && l.type === List.Types.BACKLOG,
      );
      if (existingBacklog) {
        throw 'backlogAlreadyExists';
      }
    }

    // backlog 위치 강제: 항상 같은 레인 내 가장 왼쪽이어야 한다
    if (values.type === List.Types.BACKLOG && !_.isUndefined(values.position)) {
      const otherTopLevel = lists.filter((l) => l.parentListId === null);
      const minPosition = otherTopLevel.reduce(
        (min, l) => (l.position !== null && (min === null || l.position < min) ? l.position : min),
        null,
      );
      if (minPosition !== null && values.position >= minPosition) {
        throw 'backlogMustBeLeftmost';
      }
    }

    // backlog가 아닌 리스트는 같은 레인의 backlog 왼쪽으로 이동할 수 없다
    if (
      values.type !== List.Types.BACKLOG &&
      !_.isUndefined(values.position) &&
      values.position !== null
    ) {
      const backlog = lists.find((l) => l.parentListId === null && l.type === List.Types.BACKLOG);
      if (backlog && backlog.position !== null && values.position <= backlog.position) {
        throw 'backlogMustBeLeftmost';
      }
    }

    // task 컬럼이고 wipLimit가 있을 때, 보드 systemWipLimit 합산 제약 검증
    if (
      values.type === List.Types.TASK &&
      values.wipLimit &&
      values.board &&
      values.board.systemWipLimit !== null &&
      values.board.systemWipLimit !== undefined &&
      Number(values.board.systemWipLimit) > 0
    ) {
      const sum = await sails.helpers.lists.getTaskWipLimitSum.with({
        boardId: values.board.id,
        excludeListId: null,
        virtualList: {
          type: List.Types.TASK,
          wipLimit: Number(values.wipLimit),
          parentListId: null,
        },
      });
      if (sum > Number(values.board.systemWipLimit)) {
        throw 'wipLimitSumExceedsSystemLimit';
      }
    }

    // 같은 레인의 최상위 리스트들로만 reposition 계산
    const samePositionScope = lists.filter((l) => l.parentListId === null);
    const { position, repositions } = sails.helpers.utils.insertToPositionables(
      values.position,
      samePositionScope,
    );

    if (repositions.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const reposition of repositions) {
        // eslint-disable-next-line no-await-in-loop
        await List.qm.updateOne(
          {
            id: reposition.record.id,
            boardId: reposition.record.boardId,
          },
          {
            position: reposition.position,
          },
        );

        sails.sockets.broadcast(`board:${values.board.id}`, 'listUpdate', {
          item: {
            id: reposition.record.id,
            position: reposition.position,
          },
        });

        // TODO: send webhooks
      }
    }

    const list = await List.qm.createOne({
      ...values,
      position,
      boardId: values.board.id,
    });

    sails.sockets.broadcast(
      `board:${list.boardId}`,
      'listCreate',
      {
        item: list,
      },
      inputs.request,
    );

    const webhooks = await Webhook.qm.getAll();

    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.LIST_CREATE,
      buildData: () => ({
        item: list,
        included: {
          projects: [inputs.project],
          boards: [values.board],
        },
      }),
      user: inputs.actorUser,
    });

    return list;
  },
};
