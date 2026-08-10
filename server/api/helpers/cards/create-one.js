/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { buildPrefixedName, stripPrefixedName } = require('../../../utils/card-prefix');

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
    request: {
      type: 'ref',
    },
  },

  exits: {
    positionMustBeInValues: {},
    wipLimitExceeded: {},
    systemWipLimitExceeded: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    if (values.dueDate) {
      if (_.isNil(values.isDueCompleted)) {
        values.isDueCompleted = false;
      }
    } else {
      delete values.isDueCompleted;
    }

    // WIP 한도 검증 (block 모드일 때만 차단) — 이동(update-one.js)과 동일한 규칙.
    // 신규 생성도 대상 컬럼의 WIP 를 늘리므로 같은 검사를 하지 않으면 생성 API 가 우회 경로가 된다.
    //  - 컬럼 wipLimit 초과: 부모 wipLimit + (부모 자체 + 모든 자식) 카드 합산
    //  - systemWipLimit 초과: wipLimit 설정된 task 컬럼(부모+자식) 카드 모두 카운트
    if (
      values.board.wipLimitMode === Board.WipLimitModes.BLOCK &&
      values.list.type === List.Types.TASK
    ) {
      // 효과적 부모 list 결정 (sub-column이면 그 부모를 lookup)
      let targetParent = values.list;
      if (values.list.parentListId) {
        targetParent = await List.qm.getOneById(values.list.parentListId);
      }

      const targetIsLimited =
        targetParent && targetParent.wipLimit !== null && targetParent.wipLimit !== undefined;

      if (targetIsLimited) {
        // 1) 대상 컬럼 자체 WIP 검증 (부모 + 자식 합산)
        const targetListIds = [targetParent.id];
        const targetChildren = await List.find({ parentListId: targetParent.id });
        targetChildren.forEach((child) => targetListIds.push(child.id));

        const currentCount = await Card.count({
          listId: targetListIds,
          position: { '!=': null },
        });

        if (currentCount + 1 > targetParent.wipLimit) {
          throw 'wipLimitExceeded';
        }

        // 2) systemWipLimit 검증
        if (values.board.systemWipLimit !== null && values.board.systemWipLimit !== undefined) {
          const allLists = await List.qm.getByBoardId(values.board.id);
          const limitedParentIds = allLists
            .filter(
              (l) =>
                l.type === List.Types.TASK &&
                !l.parentListId &&
                l.wipLimit !== null &&
                l.wipLimit !== undefined,
            )
            .map((l) => l.id);

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

            if (totalCount + 1 > values.board.systemWipLimit) {
              throw 'systemWipLimitExceeded';
            }
          }
        }
      }
    }

    if (sails.helpers.lists.isFinite(values.list)) {
      if (_.isUndefined(values.position)) {
        throw 'positionMustBeInValues';
      }

      const cards = await Card.qm.getByListId(values.list.id);

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

          sails.sockets.broadcast(`board:${values.board.id}`, 'cardUpdate', {
            item: {
              id: reposition.record.id,
              position: reposition.position,
            },
          });

          // TODO: send webhooks
        }
      }
    } else {
      delete values.position;
    }

    if (List.TYPE_STATE_BY_TYPE[values.list.type] === List.TypeStates.CLOSED) {
      values.isClosed = true;
    }

    // 보드에 카드 말머리가 활성화되어 있으면 카드명 앞에 "[말머리-순번] "을 붙인다.
    // 순번은 보드별로 원자적으로 점유해 동시 생성 시에도 중복되지 않도록 한다.
    // ponytail: 순번 점유 후 카드 insert 가 실패하면 그 번호는 결번으로 남는다.
    // 유일성은 보장되므로 허용하며, 결번 없는 연속성이 필요해지면 점유+insert 를 단일 트랜잭션으로 묶는다.
    const { board } = values;
    const prefix = board.cardPrefixEnabled && board.cardPrefix ? board.cardPrefix.trim() : '';

    if (prefix && values.name) {
      const number = await Board.qm.claimCardPrefixNumber(board.id);

      if (number !== null) {
        // 엑셀 재가져오기 등으로 이미 "[말머리-순번] " 형식이 붙은 이름은
        // 기존 말머리를 제거한 뒤 새 순번을 부여한다 (이중 부착 방지).
        values.name = buildPrefixedName(prefix, number, stripPrefixedName(values.name));
      }
    }

    const card = await Card.qm.createOne({
      ...values,
      boardId: values.board.id,
      listId: values.list.id,
      // 컬럼이 특정 스윔레인에 속한 경우 카드도 그 레인에 귀속
      swimLaneId: values.swimLaneId || values.list.swimLaneId || null,
      creatorUserId: values.creatorUser.id,
      listChangedAt: new Date().toISOString(),
    });

    sails.sockets.broadcast(
      `board:${card.boardId}`,
      'cardCreate',
      {
        item: card,
      },
      inputs.request,
    );

    const webhooks = await Webhook.qm.getAll();

    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.CARD_CREATE,
      buildData: () => ({
        item: card,
        included: {
          projects: [inputs.project],
          boards: [values.board],
          lists: [values.list],
        },
      }),
      user: values.creatorUser,
    });

    if (values.creatorUser.subscribeToOwnCards) {
      try {
        await CardSubscription.qm.createOne({
          cardId: card.id,
          userId: card.creatorUserId,
        });
      } catch (error) {
        if (error.code !== 'E_UNIQUE') {
          throw error;
        }
      }

      sails.sockets.broadcast(`user:${card.creatorUserId}`, 'cardUpdate', {
        item: {
          id: card.id,
          isSubscribed: true,
        },
      });

      // TODO: send webhooks
    }

    await sails.helpers.actions.createOne.with({
      webhooks,
      values: {
        card,
        type: Action.Types.CREATE_CARD,
        data: {
          card: _.pick(card, ['name']),
          list: _.pick(values.list, ['id', 'type', 'name']),
        },
        user: values.creatorUser,
      },
      project: inputs.project,
      board: values.board,
      list: values.list,
    });

    return card;
  },
};
