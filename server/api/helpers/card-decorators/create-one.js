/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const MAX_DECORATORS_PER_CARD = 5;

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
    request: {
      type: 'ref',
    },
  },

  exits: {
    decoratorAlreadyInCard: {},
    maxDecoratorsReached: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    // 카드당 데코레이터 최대 5개 제한 검증
    const existingCardDecorators = await CardDecorator.qm.getByCardId(values.card.id);

    if (existingCardDecorators.length >= MAX_DECORATORS_PER_CARD) {
      throw 'maxDecoratorsReached';
    }

    let cardDecorator;
    try {
      cardDecorator = await CardDecorator.qm.createOne({
        cardId: values.card.id,
        decoratorId: values.decorator.id,
      });
    } catch (error) {
      if (error.code === 'E_UNIQUE') {
        throw 'decoratorAlreadyInCard';
      }

      throw error;
    }

    sails.sockets.broadcast(
      `board:${inputs.board.id}`,
      'cardDecoratorCreate',
      {
        item: cardDecorator,
      },
      inputs.request,
    );

    return cardDecorator;
  },
};
