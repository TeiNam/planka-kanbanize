/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';

const BLOCKER_STATUS_ACTIVE = 'active';

// 카드별 블로커 목록
export const makeSelectBlockersByCardId = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      if (!id) {
        return id;
      }

      const cardModel = Card.withId(id);

      if (!cardModel) {
        return cardModel;
      }

      return cardModel.blockers.toRefArray();
    },
  );

export const selectBlockersByCardId = makeSelectBlockersByCardId();

// 카드별 활성 블로커 수
export const makeSelectActiveBlockerCount = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      if (!id) {
        return 0;
      }

      const cardModel = Card.withId(id);

      if (!cardModel) {
        return 0;
      }

      return cardModel.blockers.filter({ status: BLOCKER_STATUS_ACTIVE }).count();
    },
  );

export const selectActiveBlockerCount = makeSelectActiveBlockerCount();

// 카드에 활성 블로커가 있는지 여부
export const makeSelectHasActiveBlockers = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      if (!id) {
        return false;
      }

      const cardModel = Card.withId(id);

      if (!cardModel) {
        return false;
      }

      return cardModel.blockers.filter({ status: BLOCKER_STATUS_ACTIVE }).exists();
    },
  );

export const selectHasActiveBlockers = makeSelectHasActiveBlockers();

export default {
  makeSelectBlockersByCardId,
  selectBlockersByCardId,
  makeSelectActiveBlockerCount,
  selectActiveBlockerCount,
  makeSelectHasActiveBlockers,
  selectHasActiveBlockers,
};
