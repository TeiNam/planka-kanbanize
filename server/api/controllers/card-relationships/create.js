/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
  CHILD_CARD_NOT_FOUND: {
    childCardNotFound: 'Child card not found',
  },
  CHILD_CARD_NOT_IN_BOARD: {
    childCardNotInBoard: 'Child card must belong to the same board',
  },
  MAX_SUB_TICKETS_REACHED: {
    maxSubTicketsReached: 'Maximum 20 sub-tickets allowed per card',
  },
  NESTING_NOT_ALLOWED: {
    nestingNotAllowed: 'Sub-tickets cannot have their own sub-tickets',
  },
  NO_LIST_FOUND: {
    noListFound: 'No list found in the board',
  },
};

module.exports = {
  inputs: {
    cardId: {
      ...idInput,
      required: true,
    },
    childCardId: idInput,
    type: {
      type: 'string',
      isIn: Object.values(CardRelationship.Types),
      defaultsTo: CardRelationship.Types.SUB_TICKET,
    },
    position: {
      type: 'number',
    },
    name: {
      type: 'string',
      maxLength: 1024,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    cardNotFound: {
      responseType: 'notFound',
    },
    childCardNotFound: {
      responseType: 'notFound',
    },
    childCardNotInBoard: {
      responseType: 'conflict',
    },
    maxSubTicketsReached: {
      responseType: 'conflict',
    },
    nestingNotAllowed: {
      responseType: 'conflict',
    },
    noListFound: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const { card, board, project } = await sails.helpers.cards
      .getPathToProjectById(inputs.cardId)
      .intercept('pathNotFound', () => Errors.CARD_NOT_FOUND);

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.CARD_NOT_FOUND;
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    // childCard 존재 확인 또는 새 카드 자동 생성
    let childCard;

    if (inputs.childCardId) {
      childCard = await Card.qm.getOneById(inputs.childCardId);

      if (!childCard) {
        throw Errors.CHILD_CARD_NOT_FOUND;
      }

      // childCard가 동일 보드에 속하는지 확인
      const childList = await List.qm.getOneById(childCard.listId);

      if (!childList || childList.boardId !== board.id) {
        throw Errors.CHILD_CARD_NOT_IN_BOARD;
      }
    } else {
      // childCardId 미제공 시 새 카드를 보드의 첫 번째 리스트에 자동 생성
      const lists = await List.qm.getByBoardId(board.id, {
        typeOrTypes: List.KANBAN_TYPES,
        sort: ['position', 'id'],
      });

      if (lists.length === 0) {
        throw Errors.NO_LIST_FOUND;
      }

      const firstList = lists[0];
      const cardName = inputs.name || `Sub-ticket of ${card.name}`.substring(0, 1024);

      childCard = await sails.helpers.cards.createOne.with({
        values: {
          type: board.defaultCardType || Card.Types.PROJECT,
          name: cardName,
          position: 0,
          board,
          list: firstList,
          creatorUser: currentUser,
        },
        project,
        request: this.req,
      });
    }

    const values = {
      childCard,
      type: inputs.type,
      position: _.isUndefined(inputs.position) ? Infinity : inputs.position,
    };

    const cardRelationship = await sails.helpers.cardRelationships.createOne
      .with({
        values,
        parentCard: card,
        board,
        project,
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('maxSubTicketsReached', () => Errors.MAX_SUB_TICKETS_REACHED)
      .intercept('nestingNotAllowed', () => Errors.NESTING_NOT_ALLOWED);

    const response = {
      item: cardRelationship,
    };

    if (!inputs.childCardId) {
      response.included = {
        cards: [childCard],
      };
    }

    return response;
  },
};
