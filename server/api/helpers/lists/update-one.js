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
    values: {
      type: 'json',
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
    enableSubColumns: {
      type: 'boolean',
    },
    request: {
      type: 'ref',
    },
  },

  exits: {
    boardInValuesMustBelongToProject: {},
    backlogAlreadyExists: {},
    backlogMustBeLeftmost: {},
    wipLimitSumExceedsSystemLimit: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    // 서브컬럼 활성화: Active/Done 자식 리스트 생성
    if (inputs.enableSubColumns === true && !inputs.record.parentListId) {
      const activeSubColumn = await List.qm.createOne({
        boardId: inputs.board.id,
        type: List.Types.TASK,
        position: 65536,
        name: 'Active',
        subColumnType: 'active',
        parentListId: inputs.record.id,
      });

      sails.sockets.broadcast(`board:${inputs.board.id}`, 'listCreate', {
        item: activeSubColumn,
      });

      const doneSubColumn = await List.qm.createOne({
        boardId: inputs.board.id,
        type: List.Types.TASK,
        position: 131072,
        name: 'Done',
        subColumnType: 'done',
        parentListId: inputs.record.id,
      });

      sails.sockets.broadcast(`board:${inputs.board.id}`, 'listCreate', {
        item: doneSubColumn,
      });

      // 기존 카드를 Active 서브컬럼으로 이동
      const existingCards = await Card.qm.getByListId(inputs.record.id);

      if (existingCards.length > 0) {
        const { cards } = await Card.qm.update(
          { listId: inputs.record.id },
          { listId: activeSubColumn.id },
        );

        if (cards && cards.length > 0) {
          sails.sockets.broadcast(`board:${inputs.board.id}`, 'cardsUpdate', {
            items: cards,
          });
        }
      }
    }

    // 서브컬럼 비활성화: Done 카드를 부모 컬럼으로 병합 (Active 먼저, Done 뒤에)
    if (inputs.enableSubColumns === false && !inputs.record.parentListId) {
      const subColumns = await List.qm.getByBoardId(inputs.board.id, {
        sort: ['position', 'id'],
      });

      const childLists = subColumns.filter((l) => l.parentListId === inputs.record.id);

      const activeSubColumn = childLists.find((l) => l.subColumnType === 'active');
      const doneSubColumn = childLists.find((l) => l.subColumnType === 'done');

      let positionCounter = 65536;
      const mergedCards = [];

      // Active 서브컬럼 카드를 부모로 이동 (순서 유지)
      if (activeSubColumn) {
        const activeCards = await Card.qm.getByListId(activeSubColumn.id);
        const sortedActiveCards = _.sortBy(activeCards, ['position', 'id']);

        // eslint-disable-next-line no-restricted-syntax
        for (const card of sortedActiveCards) {
          // eslint-disable-next-line no-await-in-loop
          const { card: updatedCard } = await Card.qm.updateOne(
            { id: card.id, listId: activeSubColumn.id },
            { listId: inputs.record.id, position: positionCounter },
          );

          if (updatedCard) {
            mergedCards.push(updatedCard);
          }
          positionCounter += 65536;
        }
      }

      // Done 서브컬럼 카드를 부모로 이동 (Active 뒤에 배치)
      if (doneSubColumn) {
        const doneCards = await Card.qm.getByListId(doneSubColumn.id);
        const sortedDoneCards = _.sortBy(doneCards, ['position', 'id']);

        // eslint-disable-next-line no-restricted-syntax
        for (const card of sortedDoneCards) {
          // eslint-disable-next-line no-await-in-loop
          const { card: updatedCard } = await Card.qm.updateOne(
            { id: card.id, listId: doneSubColumn.id },
            { listId: inputs.record.id, position: positionCounter },
          );

          if (updatedCard) {
            mergedCards.push(updatedCard);
          }
          positionCounter += 65536;
        }
      }

      if (mergedCards.length > 0) {
        sails.sockets.broadcast(`board:${inputs.board.id}`, 'cardsUpdate', {
          items: mergedCards,
        });
      }

      // 서브컬럼 리스트 삭제
      // 카드는 위에서 부모로 이동시켰으므로, 클라이언트가 cascade로 카드까지 삭제하지 않도록
      // payload.cards: []를 함께 보내 LIST_DELETE_HANDLE의 단순 delete 분기를 타게 한다.
      if (activeSubColumn) {
        await List.qm.deleteOne(activeSubColumn.id);
        sails.sockets.broadcast(`board:${inputs.board.id}`, 'listDelete', {
          item: { id: activeSubColumn.id },
          included: { cards: [] },
        });
      }

      if (doneSubColumn) {
        await List.qm.deleteOne(doneSubColumn.id);
        sails.sockets.broadcast(`board:${inputs.board.id}`, 'listDelete', {
          item: { id: doneSubColumn.id },
          included: { cards: [] },
        });
      }
    }

    if (values.project && values.project.id === inputs.project.id) {
      delete values.project;
    }

    const project = values.project || inputs.project;

    if (values.board) {
      if (values.board.projectId !== project.id) {
        throw 'boardInValuesMustBelongToProject';
      }

      if (values.board.id === inputs.board.id) {
        delete values.board;
      } else {
        values.boardId = values.board.id;
      }
    }

    const board = values.board || inputs.board;

    // 결정된 최종 type
    const nextType = _.isUndefined(values.type) ? inputs.record.type : values.type;

    // backlog 유일성: 다른 backlog가 이미 존재하면 차단
    if (nextType === List.Types.BACKLOG && inputs.record.type !== List.Types.BACKLOG) {
      const siblings = await List.qm.getByBoardId(board.id, {
        sort: ['position', 'id'],
      });
      const existingBacklog = siblings.find(
        (l) =>
          l.id !== inputs.record.id && l.parentListId === null && l.type === List.Types.BACKLOG,
      );
      if (existingBacklog) {
        throw 'backlogAlreadyExists';
      }
    }

    // backlog 위치 강제: 항상 가장 왼쪽이어야 한다
    if (nextType === List.Types.BACKLOG) {
      const siblings = await List.qm.getByBoardId(board.id, {
        sort: ['position', 'id'],
      });
      const others = siblings.filter((l) => l.id !== inputs.record.id && l.parentListId === null);
      const minPosition = others.reduce(
        (min, l) => (l.position !== null && (min === null || l.position < min) ? l.position : min),
        null,
      );

      const targetPosition = _.isUndefined(values.position)
        ? inputs.record.position
        : values.position;

      // 다른 리스트가 모두 backlog 오른쪽에 있어야 함
      if (minPosition !== null && targetPosition !== null && targetPosition >= minPosition) {
        throw 'backlogMustBeLeftmost';
      }
    }

    // backlog가 아닌 리스트는 backlog보다 왼쪽으로 이동할 수 없다
    if (
      nextType !== List.Types.BACKLOG &&
      !_.isUndefined(values.position) &&
      values.position !== null
    ) {
      const siblings = await List.qm.getByBoardId(board.id, {
        sort: ['position', 'id'],
      });
      const backlog = siblings.find(
        (l) =>
          l.id !== inputs.record.id && l.parentListId === null && l.type === List.Types.BACKLOG,
      );
      if (backlog && backlog.position !== null && values.position <= backlog.position) {
        throw 'backlogMustBeLeftmost';
      }
    }

    // task 컬럼 wipLimit 합산이 board.systemWipLimit을 초과하지 않는지 검증.
    // type이 task로 바뀌거나, 기존 task 컬럼의 wipLimit이 변경되는 경우 적용.
    {
      const nextWipLimit = _.isUndefined(values.wipLimit)
        ? inputs.record.wipLimit
        : values.wipLimit;
      const nextParentListId = _.isUndefined(values.parentListId)
        ? inputs.record.parentListId
        : values.parentListId;
      const becomesTask = nextType === List.Types.TASK;
      const wasTask = inputs.record.type === List.Types.TASK;
      const limitChanged = !_.isUndefined(values.wipLimit);
      const typeChanged = !_.isUndefined(values.type) && values.type !== inputs.record.type;
      const isTopLevel = !nextParentListId; // null 또는 undefined 모두 최상위로 취급

      const hasSystemLimit =
        board.systemWipLimit !== null &&
        board.systemWipLimit !== undefined &&
        Number(board.systemWipLimit) > 0;

      const shouldCheck =
        isTopLevel &&
        becomesTask &&
        nextWipLimit &&
        hasSystemLimit &&
        (typeChanged || limitChanged || !wasTask);

      if (shouldCheck) {
        const sum = await sails.helpers.lists.getTaskWipLimitSum.with({
          boardId: board.id,
          excludeListId: inputs.record.id,
          virtualList: {
            type: List.Types.TASK,
            wipLimit: Number(nextWipLimit),
            parentListId: null,
          },
        });
        if (sum > Number(board.systemWipLimit)) {
          throw 'wipLimitSumExceedsSystemLimit';
        }
      }
    }

    if (!_.isUndefined(values.position)) {
      const lists = await sails.helpers.boards.getKanbanListsById(board.id, inputs.record.id);

      const { position, repositions } = sails.helpers.utils.insertToPositionables(
        values.position,
        lists,
      );

      values.position = position;

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

          sails.sockets.broadcast(`board:${board.id}`, 'listUpdate', {
            item: {
              id: reposition.record.id,
              position: reposition.position,
            },
          });

          // TODO: send webhooks
        }
      }
    }

    let cardIdsByLabelId;
    let prevLabels;

    if (values.board) {
      const cards = await Card.qm.getByListId(inputs.record.id);
      const cardIds = sails.helpers.utils.mapRecords(cards);

      const cardLabels = await CardLabel.qm.getByCardIds(cardIds);

      cardIdsByLabelId = cardLabels.reduce(
        (result, { cardId, labelId }) => ({
          ...result,
          [labelId]: [...(result[labelId] || []), cardId],
        }),
        {},
      );

      prevLabels = await Label.qm.getByIds(Object.keys(cardIdsByLabelId));

      const boardMemberUserIds = await sails.helpers.boards.getMemberUserIds(values.board.id);

      await CardSubscription.qm.delete({
        cardId: cardIds,
        userId: {
          '!=': boardMemberUserIds,
        },
      });

      await CardMembership.qm.delete({
        cardId: cardIds,
        userId: {
          '!=': boardMemberUserIds,
        },
      });

      await CardLabel.qm.delete({
        cardId: cardIds,
      });

      const taskLists = await TaskList.qm.getByCardIds(cardIds);
      const taskListIds = sails.helpers.utils.mapRecords(taskLists);

      await Task.qm.update(
        {
          taskListId: taskListIds,
          assigneeUserId: {
            '!=': boardMemberUserIds,
          },
        },
        {
          assigneeUserId: null,
        },
      );

      await sails.helpers.cards.detachCustomFields(cardIds, inputs.board.id, !!values.project);
    }

    const { list, tasks } = await List.qm.updateOne(inputs.record.id, values);

    if (list) {
      if (values.board) {
        if (prevLabels.length > 0) {
          const labels = await Label.qm.getByBoardId(list.boardId);
          const labelByName = _.keyBy(labels, 'name');

          const cardLabelsValues = (
            await Promise.all(
              prevLabels.map(async (label) => {
                let labelId;
                if (labelByName[label.name]) {
                  ({ id: labelId } = labelByName[label.name]);
                } else {
                  ({ id: labelId } = await sails.helpers.labels.createOne.with({
                    project,
                    values: {
                      ..._.omit(label, ['id', 'boardId', 'createdAt', 'updatedAt']),
                      board,
                    },
                    actorUser: inputs.actorUser,
                  }));
                }

                return cardIdsByLabelId[label.id].map((cardId) => ({
                  cardId,
                  labelId,
                }));
              }),
            )
          ).flat();

          await CardLabel.qm.create(cardLabelsValues);
        }

        sails.sockets.broadcast(
          `board:${inputs.board.id}`,
          'listUpdate',
          {
            item: {
              id: list.id,
              boardId: null,
            },
          },
          inputs.request,
        );

        sails.sockets.broadcast(`board:${list.boardId}`, 'listUpdate', {
          item: list,
        });

        // TODO: add transfer action
      } else {
        sails.sockets.broadcast(
          `board:${list.boardId}`,
          'listUpdate',
          {
            item: list,
          },
          inputs.request,
        );
      }

      if (tasks) {
        const taskListIds = sails.helpers.utils.mapRecords(tasks, 'taskListId', true);
        const taskLists = await TaskList.qm.getByIds(taskListIds);
        const taskListById = _.keyBy(taskLists, 'id');

        const cardIds = sails.helpers.utils.mapRecords(taskLists, 'cardId', true);
        const cards = await Card.qm.getByIds(cardIds);
        const cardById = _.keyBy(cards, 'id');

        const boardIdByTaskId = tasks.reduce(
          (result, task) => ({
            ...result,
            [task.id]: cardById[taskListById[task.taskListId].cardId].boardId,
          }),
          {},
        );

        tasks.forEach((task) => {
          sails.sockets.broadcast(`board:${boardIdByTaskId[task.id]}`, 'taskUpdate', {
            item: task,
          });
        });

        // TODO: send webhooks
      }

      const webhooks = await Webhook.qm.getAll();

      sails.helpers.utils.sendWebhooks.with({
        webhooks,
        event: Webhook.Events.LIST_UPDATE,
        buildData: () => ({
          item: list,
          included: {
            projects: [inputs.project],
            boards: [inputs.board],
          },
        }),
        buildPrevData: () => ({
          item: inputs.record,
        }),
        user: inputs.actorUser,
      });
    }

    return list;
  },
};
