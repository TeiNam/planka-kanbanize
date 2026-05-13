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
  CARD_DECORATOR_NOT_FOUND: {
    cardDecoratorNotFound: 'Card decorator not found',
  },
};

module.exports = {
  inputs: {
    id: {
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
    cardDecoratorNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const cardDecorator = await CardDecorator.qm.getOneById(inputs.id);

    if (!cardDecorator) {
      throw Errors.CARD_DECORATOR_NOT_FOUND;
    }

    const { card, list, board, project } = await sails.helpers.cards
      .getPathToProjectById(cardDecorator.cardId)
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

    const deletedCardDecorator = await sails.helpers.cardDecorators.deleteOne.with({
      project,
      board,
      list,
      card,
      record: cardDecorator,
      actorUser: currentUser,
      request: this.req,
    });

    if (!deletedCardDecorator) {
      throw Errors.CARD_DECORATOR_NOT_FOUND;
    }

    return {
      item: deletedCardDecorator,
    };
  },
};
