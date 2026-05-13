/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'BlockerLinkedCard';

  static fields = {
    id: attr(),
    position: attr(),
    blockerId: fk({
      to: 'Blocker',
      as: 'blocker',
      relatedName: 'linkedCards',
    }),
    cardId: fk({
      to: 'Card',
      as: 'card',
      relatedName: 'blockerLinks',
    }),
  };

  static reducer({ type, payload }, BlockerLinkedCard) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.blockerLinkedCards) {
          payload.blockerLinkedCards.forEach((blockerLinkedCard) => {
            BlockerLinkedCard.upsert(blockerLinkedCard);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        BlockerLinkedCard.all().delete();

        if (payload.blockerLinkedCards) {
          payload.blockerLinkedCards.forEach((blockerLinkedCard) => {
            BlockerLinkedCard.upsert(blockerLinkedCard);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.blockerLinkedCards) {
          payload.blockerLinkedCards.forEach((blockerLinkedCard) => {
            BlockerLinkedCard.upsert(blockerLinkedCard);
          });
        }

        break;
      case ActionTypes.BLOCKER_LINKED_CARD_CREATE:
      case ActionTypes.BLOCKER_LINKED_CARD_CREATE_HANDLE:
        BlockerLinkedCard.upsert(payload.blockerLinkedCard);
        break;
      case ActionTypes.BLOCKER_LINKED_CARD_CREATE__SUCCESS:
        BlockerLinkedCard.withId(payload.localId)?.delete();
        BlockerLinkedCard.upsert(payload.blockerLinkedCard);
        break;
      case ActionTypes.BLOCKER_LINKED_CARD_DELETE:
      case ActionTypes.BLOCKER_LINKED_CARD_DELETE_HANDLE: {
        const model = BlockerLinkedCard.withId(payload.blockerLinkedCard.id);
        if (model) model.delete();
        break;
      }
      default:
    }
  }
}
