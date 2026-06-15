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
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  exits: {
    wipLimitSumExceedsSystemLimit: {},
  },

  async fn(inputs) {
    const { isSubscribed, ...values } = inputs.values;

    let board;
    if (_.isEmpty(values)) {
      board = inputs.record;
    } else {
      const scoper = sails.helpers.projects.makeScoper.with({
        record: inputs.project,
      });

      if (!_.isUndefined(values.position)) {
        const boards = await Board.qm.getByProjectId(inputs.record.projectId, {
          exceptIdOrIds: inputs.record.id,
        });

        const { position, repositions } = sails.helpers.utils.insertToPositionables(
          values.position,
          boards,
        );

        values.position = position;

        if (repositions.length > 0) {
          await scoper.getUserIdsWithFullProjectVisibility();
          const clonedScoper = scoper.clone();

          // eslint-disable-next-line no-restricted-syntax
          for (const reposition of repositions) {
            // eslint-disable-next-line no-await-in-loop
            await Board.qm.updateOne(
              {
                id: reposition.record.id,
                projectId: reposition.record.projectId,
              },
              {
                position: reposition.position,
              },
            );

            clonedScoper.replaceBoard(reposition.record);
            // eslint-disable-next-line no-await-in-loop
            const boardRelatedUserIds = await clonedScoper.getBoardRelatedUserIds();

            boardRelatedUserIds.forEach((userId) => {
              sails.sockets.broadcast(`user:${userId}`, 'boardUpdate', {
                item: {
                  id: reposition.record.id,
                  position: reposition.position,
                },
              });
            });

            // TODO: send webhooks
          }
        }
      }

      // systemWipLimit을 설정/감소할 때, 기존 task 컬럼들 wipLimit 합이 초과하면 거부
      if (
        !_.isUndefined(values.systemWipLimit) &&
        values.systemWipLimit !== null &&
        values.systemWipLimit !== undefined
      ) {
        const sum = await sails.helpers.lists.getTaskWipLimitSum.with({
          boardId: inputs.record.id,
          excludeListId: null,
        });
        if (sum > values.systemWipLimit) {
          throw 'wipLimitSumExceedsSystemLimit';
        }
      }

      // 말머리 문자열이 변경되면 순번을 1부터 다시 시작한다.
      // (예: "DB" → "API"로 바꾸면 [API-01]부터 시작)
      if (
        !_.isUndefined(values.cardPrefix) &&
        (values.cardPrefix || '') !== (inputs.record.cardPrefix || '')
      ) {
        values.cardPrefixNextNumber = 1;
      }

      board = await Board.qm.updateOne(inputs.record.id, values);

      if (!board) {
        return board;
      }

      // 스윔레인/긴급 레인 토글 부수효과 처리
      const wasSwimLanesEnabled = inputs.record.isSwimLanesEnabled;
      const wasExpediteLaneEnabled = inputs.record.isExpediteLaneEnabled;
      const prevExpediteWipLimit = inputs.record.expediteWipLimit;

      const existingSwimLanes = await SwimLane.qm.getByBoardId(board.id);

      // 스윔레인 토글이 처음 켜질 때, 표준 레인이 하나도 없으면 기본 레인 생성
      if (
        !wasSwimLanesEnabled &&
        board.isSwimLanesEnabled &&
        !existingSwimLanes.some((sl) => sl.type === SwimLane.Types.STANDARD)
      ) {
        const defaultStandardLane = await SwimLane.qm.createOne({
          boardId: board.id,
          name: '기본',
          type: SwimLane.Types.STANDARD,
          position: 65535,
        });

        sails.sockets.broadcast(
          `board:${board.id}`,
          'swimLaneCreate',
          { item: defaultStandardLane },
          inputs.request,
        );
      }

      // 긴급 레인 토글이 켜질 때, expedite 레인이 없으면 생성
      if (
        !wasExpediteLaneEnabled &&
        board.isExpediteLaneEnabled &&
        !existingSwimLanes.some((sl) => sl.type === SwimLane.Types.EXPEDITE)
      ) {
        const expediteLane = await SwimLane.qm.createOne({
          boardId: board.id,
          name: '긴급',
          type: SwimLane.Types.EXPEDITE,
          position: 0,
          wipLimit: board.expediteWipLimit,
        });

        sails.sockets.broadcast(
          `board:${board.id}`,
          'swimLaneCreate',
          { item: expediteLane },
          inputs.request,
        );
      }

      // expediteWipLimit이 변경되면, 기존 expedite 레인의 wipLimit 동기화
      if (
        !_.isUndefined(values.expediteWipLimit) &&
        prevExpediteWipLimit !== board.expediteWipLimit
      ) {
        const expediteLane = existingSwimLanes.find((sl) => sl.type === SwimLane.Types.EXPEDITE);
        if (expediteLane) {
          const updated = await SwimLane.qm.updateOne(
            { id: expediteLane.id, boardId: board.id },
            { wipLimit: board.expediteWipLimit },
          );

          if (updated) {
            sails.sockets.broadcast(
              `board:${board.id}`,
              'swimLaneUpdate',
              { item: updated },
              inputs.request,
            );
          }
        }
      }

      scoper.board = board;
      const boardRelatedUserIds = await scoper.getBoardRelatedUserIds();

      boardRelatedUserIds.forEach((userId) => {
        sails.sockets.broadcast(
          `user:${userId}`,
          'boardUpdate',
          {
            item: board,
          },
          inputs.request,
        );
      });

      const webhooks = await Webhook.qm.getAll();

      sails.helpers.utils.sendWebhooks.with({
        webhooks,
        event: Webhook.Events.BOARD_UPDATE,
        buildData: () => ({
          item: board,
          included: {
            projects: [inputs.project],
          },
        }),
        buildPrevData: () => ({
          item: inputs.record,
        }),
        user: inputs.actorUser,
      });
    }

    if (!_.isUndefined(isSubscribed)) {
      const wasSubscribed = await sails.helpers.users.isBoardSubscriber(
        inputs.actorUser.id,
        board.id,
      );

      if (isSubscribed !== wasSubscribed) {
        if (isSubscribed) {
          try {
            await BoardSubscription.qm.createOne({
              boardId: board.id,
              userId: inputs.actorUser.id,
            });
          } catch (error) {
            if (error.code !== 'E_UNIQUE') {
              throw error;
            }
          }
        } else {
          await BoardSubscription.qm.deleteOne({
            boardId: board.id,
            userId: inputs.actorUser.id,
          });
        }

        sails.sockets.broadcast(
          `user:${inputs.actorUser.id}`,
          'boardUpdate',
          {
            item: {
              isSubscribed,
              id: board.id,
            },
          },
          inputs.request,
        );

        // TODO: send webhooks
      }
    }

    return board;
  },
};
