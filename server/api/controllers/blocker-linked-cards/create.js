/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  BLOCKER_NOT_FOUND: {
    blockerNotFound: 'Blocker not found',
  },
  CARD_ALREADY_LINKED: {
    cardAlreadyLinked: 'Card already linked to this blocker',
  },
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
  CANNOT_LINK_SELF: {
    cardAlreadyLinked: 'Cannot link blocker to its own card',
  },
};

module.exports = {
  inputs: {
    blockerId: {
      ...idInput,
      required: true,
    },
    cardId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    blockerNotFound: {
      responseType: 'notFound',
    },
    cardAlreadyLinked: {
      responseType: 'conflict',
    },
    cardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // 1. 블로커 경로 조회 및 권한 검증
    const pathToProject = await sails.helpers.blockers
      .getPathToProjectById(inputs.blockerId)
      .intercept('pathNotFound', () => Errors.BLOCKER_NOT_FOUND);

    const { blocker, board } = pathToProject;

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.BLOCKER_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    // 2. 대상 카드 존재 확인
    const card = await Card.qm.getOneById(inputs.cardId);

    if (!card) {
      throw Errors.CARD_NOT_FOUND;
    }

    // 3. 자기 자신 연결 방지 (블로커의 cardId와 대상 cardId 비교)
    if (blocker.cardId === inputs.cardId) {
      throw Errors.CANNOT_LINK_SELF;
    }

    // 4. 중복 연결 확인
    const existingLink = await BlockerLinkedCard.qm.getOneByBlockerIdAndCardId(
      blocker.id,
      inputs.cardId,
    );

    if (existingLink) {
      throw Errors.CARD_ALREADY_LINKED;
    }

    // 5. position 계산 (기존 연결 카드의 마지막 position + 65536)
    const existingLinks = await BlockerLinkedCard.qm.getByBlockerId(blocker.id);

    let position = 65536;
    if (existingLinks.length > 0) {
      const maxPosition = Math.max(...existingLinks.map((link) => link.position));
      position = maxPosition + 65536;
    }

    // 6. blocker_linked_card 레코드 생성
    const blockerLinkedCard = await BlockerLinkedCard.qm.createOne({
      blockerId: blocker.id,
      cardId: inputs.cardId,
      position,
    });

    // 7. WebSocket 브로드캐스트
    sails.sockets.broadcast(
      `board:${board.id}`,
      'blockerLinkedCardCreate',
      {
        item: blockerLinkedCard,
      },
      this.req,
    );

    return {
      item: blockerLinkedCard,
    };
  },
};
