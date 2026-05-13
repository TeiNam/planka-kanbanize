/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'CardDecorator';

  static fields = {
    id: attr(),
    cardId: fk({
      to: 'Card',
      as: 'card',
      relatedName: 'cardDecorators',
    }),
    decoratorId: fk({
      to: 'Decorator',
      as: 'decorator',
      relatedName: 'cardDecorators',
    }),
  };

  static reducer({ type, payload }, CardDecorator) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.cardDecorators) {
          payload.cardDecorators.forEach((cardDecorator) => {
            CardDecorator.upsert(cardDecorator);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        CardDecorator.all().delete();

        if (payload.cardDecorators) {
          payload.cardDecorators.forEach((cardDecorator) => {
            CardDecorator.upsert(cardDecorator);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.cardDecorators) {
          payload.cardDecorators.forEach((cardDecorator) => {
            CardDecorator.upsert(cardDecorator);
          });
        }

        break;
      case ActionTypes.CARD_DECORATOR_CREATE:
        CardDecorator.upsert({
          cardId: payload.cardId,
          decoratorId: payload.decoratorId,
        });

        break;
      case ActionTypes.CARD_DECORATOR_CREATE_HANDLE:
      case ActionTypes.CARD_DECORATOR_CREATE__SUCCESS:
        CardDecorator.upsert(payload.cardDecorator);

        break;
      case ActionTypes.CARD_DECORATOR_CREATE__FAILURE:
        CardDecorator.all()
          .filter({
            cardId: payload.cardId,
            decoratorId: payload.decoratorId,
          })
          .delete();

        break;
      case ActionTypes.CARD_DECORATOR_DELETE:
        CardDecorator.withId(payload.id).delete();

        break;
      case ActionTypes.CARD_DECORATOR_DELETE__SUCCESS:
      case ActionTypes.CARD_DECORATOR_DELETE_HANDLE: {
        const cardDecoratorModel = CardDecorator.withId(payload.cardDecorator.id);

        if (cardDecoratorModel) {
          cardDecoratorModel.delete();
        }

        break;
      }
      default:
    }
  }
}
