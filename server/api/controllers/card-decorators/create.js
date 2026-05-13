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
  DECORATOR_NOT_FOUND: {
    decoratorNotFound: 'Decorator not found',
  },
  DECORATOR_ALREADY_IN_CARD: {
    decoratorAlreadyInCard: 'Decorator already in card',
  },
  MAX_DECORATORS_REACHED: {
    maxDecoratorsReached: 'Maximum 5 decorators per card reached',
  },
};

module.exports = {
  inputs: {
    cardId: {
      ...idInput,
      required: true,
    },
    decoratorId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    cardNotFound: {
      responseType: 'notFound',
    },
    decoratorNotFound: {
      responseType: 'notFound',
    },
    decoratorAlreadyInCard: {
      responseType: 'conflict',
    },
    maxDecoratorsReached: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const { card, list, board, project } = await sails.helpers.cards
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

    const decorator = await Decorator.qm.getOneById(inputs.decoratorId, {
      boardId: board.id,
    });

    if (!decorator) {
      throw Errors.DECORATOR_NOT_FOUND;
    }

    const cardDecorator = await sails.helpers.cardDecorators.createOne
      .with({
        project,
        board,
        list,
        values: {
          card,
          decorator,
        },
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('decoratorAlreadyInCard', () => Errors.DECORATOR_ALREADY_IN_CARD)
      .intercept('maxDecoratorsReached', () => Errors.MAX_DECORATORS_REACHED);

    return {
      item: cardDecorator,
    };
  },
};
