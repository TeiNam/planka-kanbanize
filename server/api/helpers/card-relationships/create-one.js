/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const MAX_SUB_TICKETS_PER_CARD = 20;

module.exports = {
  inputs: {
    values: {
      type: 'ref',
      required: true,
    },
    parentCard: {
      type: 'ref',
      required: true,
    },
    board: {
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
    maxSubTicketsReached: {},
    nestingNotAllowed: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    // 상위 카드당 하위 티켓 20개 제한 검증
    const existingRelationships = await CardRelationship.qm.getByParentCardId(
      inputs.parentCard.id,
      { type: CardRelationship.Types.SUB_TICKET },
    );

    if (existingRelationships.length >= MAX_SUB_TICKETS_PER_CARD) {
      throw 'maxSubTicketsReached';
    }

    // 1단계 깊이 제한: childCard가 이미 부모인지 확인
    const childAsParent = await CardRelationship.qm.getByParentCardId(values.childCard.id, {
      type: CardRelationship.Types.SUB_TICKET,
    });

    if (childAsParent.length > 0) {
      throw 'nestingNotAllowed';
    }

    // 1단계 깊이 제한: parentCard가 이미 자식인지 확인
    const parentAsChild = await CardRelationship.qm.getByChildCardId(inputs.parentCard.id, {
      type: CardRelationship.Types.SUB_TICKET,
    });

    if (parentAsChild.length > 0) {
      throw 'nestingNotAllowed';
    }

    // position 계산 (마지막 위치 뒤에 삽입)
    const { position, repositions } = sails.helpers.utils.insertToPositionables(
      values.position,
      existingRelationships,
    );

    if (repositions.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const reposition of repositions) {
        // eslint-disable-next-line no-await-in-loop
        await CardRelationship.qm.updateOne(
          { id: reposition.record.id },
          { position: reposition.position },
        );
      }
    }

    const cardRelationship = await CardRelationship.qm.createOne({
      parentCardId: inputs.parentCard.id,
      childCardId: values.childCard.id,
      type: values.type || CardRelationship.Types.SUB_TICKET,
      position,
    });

    sails.sockets.broadcast(
      `board:${inputs.board.id}`,
      'cardRelationshipCreate',
      {
        item: cardRelationship,
      },
      inputs.request,
    );

    return cardRelationship;
  },
};
