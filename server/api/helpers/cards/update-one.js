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
    list: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    webhooks: {
      type: 'ref',
    },
    request: {
      type: 'ref',
    },
  },

  exits: {
    positionMustBeInValues: {},
    boardInValuesMustBelongToProject: {},
    listMustBeInValues: {},
    listInValuesMustBelongToBoard: {},
    coverAttachmentInValuesMustContainImage: {},
    dueDateRequired: {},
    wipLimitExceeded: {},
    systemWipLimitExceeded: {},
    cardHasActiveBlockers: {},
  },

  // TODO: use normalizeValues and refactor
  async fn(inputs) {
    const { isSubscribed, ...values } = inputs.values;

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

    if (values.list) {
      if (values.list.boardId !== board.id) {
        throw 'listInValuesMustBelongToBoard';
      }

      if (values.list.id === inputs.list.id) {
        delete values.list;
      } else {
        values.listId = values.list.id;
      }
    } else if (values.board) {
      throw 'listMustBeInValues';
    }

    const list = values.list || inputs.list;

    if (sails.helpers.lists.isFinite(list)) {
      if (values.list && _.isUndefined(values.position)) {
        throw 'positionMustBeInValues';
      }
    } else {
      values.position = null;
    }

    // 활성 블로커가 1개 이상 있는 카드는 다른 목록으로 이동할 수 없다.
    // 같은 목록 내 재정렬(values.list 없음)은 허용.
    if (values.list) {
      const activeBlockers = await Blocker.find({
        cardId: inputs.record.id,
        status: 'active',
      });
      if (activeBlockers.length > 0) {
        throw 'cardHasActiveBlockers';
      }
    }

    // WIP 한도 검증 (block 모드일 때만 차단)
    //  - 컬럼 wipLimit 초과: 부모 wipLimit + (부모 자체 + 모든 자식) 카드 합산
    //  - systemWipLimit 초과: 부모와 그 자식 list 카드 모두 카운트
    if (
      board.wipLimitMode === Board.WipLimitModes.BLOCK &&
      values.list &&
      list.type === List.Types.TASK
    ) {
      const sourceList = inputs.list;
      const isSameBoard = !values.board;

      // 효과적 부모 list 결정 (sub-column이면 그 부모를 lookup)
      let targetParent = list;
      if (list.parentListId) {
        targetParent = await List.qm.getOneById(list.parentListId);
      }
      let sourceParent = sourceList;
      if (sourceList && sourceList.parentListId) {
        sourceParent = await List.qm.getOneById(sourceList.parentListId);
      }

      const targetIsLimited =
        targetParent &&
        targetParent.wipLimit !== null &&
        targetParent.wipLimit !== undefined;
      const sourceIsLimited =
        isSameBoard &&
        sourceParent &&
        sourceParent.type === List.Types.TASK &&
        sourceParent.wipLimit !== null &&
        sourceParent.wipLimit !== undefined;
      const sameParent =
        targetParent && sourceParent && targetParent.id === sourceParent.id;

      // 1) 대상 컬럼 자체 WIP 검증 (부모 + 자식 합산)
      if (targetIsLimited && !sameParent) {
        // 부모 + 자식 list IDs
        const targetListIds = [targetParent.id];
        const targetChildren = await List.find({ parentListId: targetParent.id });
        targetChildren.forEach((c) => targetListIds.push(c.id));

        const currentCount = await Card.count({
          listId: targetListIds,
          position: { '!=': null },
        });
        if (currentCount + 1 > targetParent.wipLimit) {
          throw 'wipLimitExceeded';
        }
      }

      // 2) systemWipLimit 검증
      if (
        targetIsLimited &&
        board.systemWipLimit !== null &&
        board.systemWipLimit !== undefined
      ) {
        const allLists = await List.qm.getByBoardId(board.id);
        const limitedParentIds = allLists
          .filter(
            (l) =>
              l.type === List.Types.TASK &&
              !l.parentListId &&
              l.wipLimit !== null &&
              l.wipLimit !== undefined,
          )
          .map((l) => l.id);

        // 부모 + 자식 list IDs 모두
        const includedListIds = [];
        allLists.forEach((l) => {
          if (limitedParentIds.includes(l.id)) {
            includedListIds.push(l.id);
          } else if (l.parentListId && limitedParentIds.includes(l.parentListId)) {
            includedListIds.push(l.id);
          }
        });

        if (includedListIds.length > 0) {
          const totalCount = await Card.count({
            listId: includedListIds,
            position: { '!=': null },
          });
          const projected = sourceIsLimited && !sameParent ? totalCount : totalCount + 1;
          const adjusted = sameParent ? totalCount : projected;
          if (adjusted > board.systemWipLimit) {
            throw 'systemWipLimitExceeded';
          }
        }
      }
    }

    if (values.coverAttachment) {
      if (!values.coverAttachment.data.image) {
        throw 'coverAttachmentInValuesMustContainImage';
      }

      if (values.coverAttachment.id === inputs.record.coverAttachmentId) {
        delete values.coverAttachment;
      } else {
        values.coverAttachmentId = values.coverAttachment.id;
      }
    }

    const dueDate = _.isUndefined(values.dueDate) ? inputs.record.dueDate : values.dueDate;

    // classOfServiceId 설정 시 Expedite 최상단 배치 및 Fixed Date dueDate 검증
    if (!_.isUndefined(values.classOfServiceId) && values.classOfServiceId) {
      const classOfService = await ClassOfService.qm.getOneById(values.classOfServiceId);

      if (classOfService) {
        if (classOfService.type === ClassOfService.Types.FIXED_DATE) {
          if (!dueDate) {
            throw 'dueDateRequired';
          }
        }

        if (classOfService.type === ClassOfService.Types.EXPEDITE) {
          // 동일 Swim Lane 내 기존 Expedite 카드들 바로 뒤에 배치하여
          // 할당 시각이 빠른 순서로 자연스럽게 정렬되도록 한다.
          const swimLaneId = _.isUndefined(values.swimLaneId)
            ? inputs.record.swimLaneId
            : values.swimLaneId;

          const expediteClasses = await ClassOfService.qm.getByBoardId(board.id);
          const expediteClassIds = expediteClasses
            .filter((cos) => cos.type === ClassOfService.Types.EXPEDITE)
            .map((cos) => cos.id);

          const targetListCards = await Card.qm.getByListId(list.id, {
            exceptIdOrIds: inputs.record.id,
          });

          const existingExpediteCount = targetListCards.filter(
            (c) =>
              expediteClassIds.includes(c.classOfServiceId) &&
              (c.swimLaneId || null) === (swimLaneId || null),
          ).length;

          values.position = existingExpediteCount;
        }
      }
    }

    if (dueDate) {
      const isDueCompleted = _.isUndefined(values.isDueCompleted)
        ? inputs.record.isDueCompleted
        : values.isDueCompleted;

      if (_.isNull(isDueCompleted)) {
        values.isDueCompleted = false;
      }
    } else {
      values.isDueCompleted = null;
    }

    let card;
    if (_.isEmpty(values)) {
      card = inputs.record;
    } else {
      const { webhooks = await Webhook.qm.getAll() } = inputs;

      if (!_.isNil(values.position)) {
        const cards = await Card.qm.getByListId(list.id, {
          exceptIdOrIds: inputs.record.id,
        });

        const { position, repositions } = sails.helpers.utils.insertToPositionables(
          values.position,
          cards,
        );

        values.position = position;

        if (repositions.length > 0) {
          // eslint-disable-next-line no-restricted-syntax
          for (const reposition of repositions) {
            // eslint-disable-next-line no-await-in-loop
            await Card.qm.updateOne(
              {
                id: reposition.record.id,
                listId: reposition.record.listId,
              },
              {
                position: reposition.position,
              },
            );

            sails.sockets.broadcast(`board:${board.id}`, 'cardUpdate', {
              item: {
                id: reposition.record.id,
                position: reposition.position,
              },
            });

            // TODO: send webhooks
          }
        }
      }

      let prevLabels;
      if (values.board) {
        prevLabels = await sails.helpers.cards.getLabels(inputs.record.id);

        const boardMemberUserIds = await sails.helpers.boards.getMemberUserIds(values.board.id);

        await CardSubscription.qm.delete({
          cardId: inputs.record.id,
          userId: {
            '!=': boardMemberUserIds,
          },
        });

        await CardMembership.qm.delete({
          cardId: inputs.record.id,
          userId: {
            '!=': boardMemberUserIds,
          },
        });

        await CardLabel.qm.delete({
          cardId: inputs.record.id,
        });

        const taskLists = await TaskList.qm.getByCardId(inputs.record.id);
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

        await sails.helpers.cards.detachCustomFields(
          inputs.record.id,
          inputs.board.id,
          !!values.project,
        );
      }

      if (values.list) {
        if (values.board || inputs.list.type === List.Types.TRASH) {
          values.prevListId = null;
        } else if (sails.helpers.lists.isArchiveOrTrash(values.list)) {
          values.prevListId = inputs.list.id;
        } else if (inputs.list.type === List.Types.ARCHIVE) {
          values.prevListId = null;
        }

        const typeState = List.TYPE_STATE_BY_TYPE[values.list.type];

        if (inputs.record.isClosed) {
          if (typeState === List.TypeStates.OPENED) {
            values.isClosed = false;
          }
        } else if (typeState === List.TypeStates.CLOSED) {
          values.isClosed = true;
        }

        values.listChangedAt = new Date().toISOString();

        // completedAt / startDate 자동 계산을 메인 update에 합쳐 한 번에 반영.
        // (분리해서 후속 update를 하면 클라이언트의 updateCard.success가 stale한
        // 응답으로 카드를 덮어써 보드 즉시 반영이 깨진다.)
        const isTerminal = (l) =>
          l && (l.type === List.Types.CLOSED ||
            l.type === List.Types.DISCARD ||
            l.subColumnType === 'done');
        const fromTerminal = isTerminal(inputs.list);
        const toTerminal = isTerminal(values.list);

        if (toTerminal && !fromTerminal) {
          values.completedAt = new Date().toISOString();
        } else if (!toTerminal && fromTerminal) {
          values.completedAt = null;
        }

        // startDate: 어떤 경로든 task 컬럼에 "처음" 진입할 때 set.
        // sub-column이면 부모 list type을 기준. 한 번 set되면 보존.
        if (!inputs.record.startDate) {
          let effectiveToType = values.list.type;
          if (values.list.parentListId) {
            const parent = await List.qm.getOneById(values.list.parentListId);
            if (parent) effectiveToType = parent.type;
          }
          if (effectiveToType === List.Types.TASK) {
            values.startDate = new Date().toISOString();
          }
        }
      }

      const updateResult = await Card.qm.updateOne(inputs.record.id, values);

      ({ card } = updateResult);
      const { tasks } = updateResult;

      if (!card) {
        return card;
      }

      if (values.board) {
        const labels = await Label.qm.getByBoardId(card.boardId);
        const labelByName = _.keyBy(labels, 'name');

        const labelIds = await Promise.all(
          prevLabels.map(async (label) => {
            if (labelByName[label.name]) {
              return labelByName[label.name].id;
            }

            const { id } = await sails.helpers.labels.createOne.with({
              project,
              webhooks,
              values: {
                ..._.omit(label, ['id', 'boardId', 'createdAt', 'updatedAt']),
                board,
              },
              actorUser: inputs.actorUser,
            });

            return id;
          }),
        );

        await Promise.all(
          labelIds.map((labelId) => {
            try {
              return CardLabel.qm.createOne({
                labelId,
                cardId: card.id,
              });
            } catch (error) {
              if (error.code !== 'E_UNIQUE') {
                throw error;
              }
            }

            return Promise.resolve();
          }),
        );

        sails.sockets.broadcast(
          `board:${inputs.board.id}`,
          'cardUpdate',
          {
            item: {
              id: card.id,
              boardId: null,
            },
          },
          inputs.request,
        );

        sails.sockets.broadcast(
          `board:${card.boardId}`,
          'cardUpdate',
          {
            item: card,
          },
          inputs.request,
        );

        // TODO: add transfer action
      } else {
        sails.sockets.broadcast(
          `board:${card.boardId}`,
          'cardUpdate',
          {
            item: card,
          },
          inputs.request,
        );

        if (values.list) {
          await sails.helpers.actions.createOne.with({
            webhooks,
            values: {
              card,
              type: Action.Types.MOVE_CARD,
              data: {
                card: _.pick(card, ['name']),
                fromList: _.pick(inputs.list, ['id', 'type', 'name']),
                toList: _.pick(values.list, ['id', 'type', 'name']),
              },
              user: inputs.actorUser,
            },
            project: inputs.project,
            board: inputs.board,
            list: values.list,
          });

          // 카드 이동 이력 기록 및 WIP 초과 여부 확인
          await sails.helpers.cards.recordMovement.with({
            card,
            board,
            fromList: inputs.list,
            toList: values.list,
            user: inputs.actorUser,
          });

          // Commitment Point 경계 통과 감지 및 기록 (CP 등록된 보드에서 추가 동작)
          await sails.helpers.cards.detectCommitmentPointCrossing.with({
            card,
            board,
            fromList: inputs.list,
            toList: values.list,
          });

          // completedAt 변경 감지 시 블로커 자동 해결 트리거
          if (card.completedAt !== inputs.record.completedAt) {
            await sails.helpers.blockers.autoResolve.with({
              card,
              board,
              request: inputs.request,
            });
          }

          // wipExceeded broadcast 제거: 클라이언트가 자체 셀렉터(makeSelectWipCount)로
          // 컬럼 카드 수 vs list.wipLimit을 비교하므로 별도 알림 불필요.
          // 과거 broadcast는 payload.card에 listId/boardId가 없어 ORM upsert가 카드 상태를 손상시켜
          // 보드 렌더링이 깨지는 문제가 있었다.
        }
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

      sails.helpers.utils.sendWebhooks.with({
        webhooks,
        event: Webhook.Events.CARD_UPDATE,
        buildData: () => ({
          item: card,
          included: {
            projects: [project],
            boards: [board],
            lists: [list],
          },
        }),
        buildPrevData: () => ({
          item: inputs.record,
          included: {
            projects: [inputs.project],
            boards: [inputs.board],
            lists: [inputs.list],
          },
        }),
        user: inputs.actorUser,
      });
    }

    if (!_.isUndefined(isSubscribed)) {
      const wasSubscribed = await sails.helpers.users.isCardSubscriber(
        inputs.actorUser.id,
        card.id,
      );

      if (isSubscribed !== wasSubscribed) {
        if (isSubscribed) {
          try {
            await CardSubscription.qm.createOne({
              cardId: card.id,
              userId: inputs.actorUser.id,
            });
          } catch (error) {
            if (error.code !== 'E_UNIQUE') {
              throw error;
            }
          }
        } else {
          await CardSubscription.qm.deleteOne({
            cardId: card.id,
            userId: inputs.actorUser.id,
          });
        }

        sails.sockets.broadcast(
          `user:${inputs.actorUser.id}`,
          'cardUpdate',
          {
            item: {
              isSubscribed,
              id: card.id,
            },
          },
          inputs.request,
        );

        // TODO: send webhooks
      }
    }

    return card;
  },
};
