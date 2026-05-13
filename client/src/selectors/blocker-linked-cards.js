/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';

// 블로커별 연결 카드 목록 (position 정렬, 카드 정보 포함)
export const makeSelectLinkedCardsByBlockerId = () =>
  createSelector(
    orm,
    (_, blockerId) => blockerId,
    ({ Blocker }, blockerId) => {
      if (!blockerId) {
        return [];
      }

      const blockerModel = Blocker.withId(blockerId);

      if (!blockerModel) {
        return [];
      }

      return blockerModel.linkedCards
        .toModelArray()
        .sort((a, b) => a.position - b.position)
        .map((link) => ({
          ...link.ref,
          card: link.card?.ref,
        }));
    },
  );

export const selectLinkedCardsByBlockerId = makeSelectLinkedCardsByBlockerId();

export default {
  makeSelectLinkedCardsByBlockerId,
  selectLinkedCardsByBlockerId,
};
