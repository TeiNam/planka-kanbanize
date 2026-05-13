/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'CardRelationship';

  static fields = {
    id: attr(),
    type: attr(),
    position: attr(),
    parentCardId: fk({
      to: 'Card',
      as: 'parentCard',
      relatedName: 'childRelationships',
    }),
    childCardId: fk({
      to: 'Card',
      as: 'childCard',
      relatedName: 'parentRelationships',
    }),
  };

  static reducer({ type, payload }, CardRelationship) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
        if (payload.cardRelationships) {
          payload.cardRelationships.forEach((cardRelationship) => {
            CardRelationship.upsert(cardRelationship);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        CardRelationship.all().delete();

        if (payload.cardRelationships) {
          payload.cardRelationships.forEach((cardRelationship) => {
            CardRelationship.upsert(cardRelationship);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.cardRelationships) {
          payload.cardRelationships.forEach((cardRelationship) => {
            CardRelationship.upsert(cardRelationship);
          });
        }

        break;
      case ActionTypes.CARD_RELATIONSHIP_CREATE:
      case ActionTypes.CARD_RELATIONSHIP_CREATE_HANDLE:
        CardRelationship.upsert(payload.cardRelationship);

        break;
      case ActionTypes.CARD_RELATIONSHIP_CREATE__SUCCESS:
        CardRelationship.withId(payload.localId).delete();
        CardRelationship.upsert(payload.cardRelationship);

        break;
      case ActionTypes.CARD_RELATIONSHIP_CREATE__FAILURE:
        CardRelationship.withId(payload.localId).delete();

        break;
      case ActionTypes.CARD_RELATIONSHIP_SORT__SUCCESS:
        payload.cardRelationships.forEach((cardRelationship) => {
          CardRelationship.upsert(cardRelationship);
        });

        break;
      case ActionTypes.CARD_RELATIONSHIP_DELETE:
        CardRelationship.withId(payload.id).delete();

        break;
      case ActionTypes.CARD_RELATIONSHIP_DELETE__SUCCESS:
      case ActionTypes.CARD_RELATIONSHIP_DELETE_HANDLE: {
        const cardRelationshipModel = CardRelationship.withId(payload.cardRelationship.id);

        if (cardRelationshipModel) {
          cardRelationshipModel.delete();
        }

        break;
      }
      default:
    }
  }
}
