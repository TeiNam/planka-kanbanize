/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';

// CFD 데이터 (보드별 일별 스냅샷 기반)
export const makeSelectCfdData = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board }, id) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      const snapshots = boardModel.dailySnapshots.orderBy('snapshotDate').toRefArray();

      if (snapshots.length === 0) {
        return null;
      }

      // 날짜별로 그룹핑
      const dateMap = {};
      snapshots.forEach((snapshot) => {
        if (!dateMap[snapshot.snapshotDate]) {
          dateMap[snapshot.snapshotDate] = {};
        }
        dateMap[snapshot.snapshotDate][snapshot.listId] = snapshot.cardCount;
      });

      return {
        dates: Object.keys(dateMap).sort(),
        dataByDate: dateMap,
      };
    },
  );

export const selectCfdData = makeSelectCfdData();

// Lead Time 데이터 (완료된 카드 기반)
export const makeSelectLeadTimeData = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board, Card }, id) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      const completedCards = Card.filter({ boardId: id })
        .toModelArray()
        .filter((card) => card.completedAt !== null && card.completedAt !== undefined);

      if (completedCards.length === 0) {
        return null;
      }

      const leadTimes = completedCards
        .map((card) => {
          const completedAt = new Date(card.completedAt);
          const createdAt = new Date(card.createdAt);
          const diffMs = completedAt - createdAt;
          return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        })
        .sort((a, b) => a - b);

      const percentile85Index = Math.ceil(leadTimes.length * 0.85) - 1;

      return {
        values: leadTimes,
        percentile85: leadTimes[Math.max(0, percentile85Index)],
        average: Math.round(leadTimes.reduce((sum, v) => sum + v, 0) / leadTimes.length),
      };
    },
  );

export const selectLeadTimeData = makeSelectLeadTimeData();

// Throughput 데이터 (주 단위 완료 건수)
export const makeSelectThroughputData = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      if (!id) {
        return id;
      }

      const completedCards = Card.filter({ boardId: id })
        .toModelArray()
        .filter((card) => card.completedAt !== null && card.completedAt !== undefined);

      if (completedCards.length === 0) {
        return null;
      }

      // 주 단위로 그룹핑
      const weekMap = {};
      completedCards.forEach((card) => {
        const completedAt = new Date(card.completedAt);
        const weekStart = new Date(completedAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weekMap[weekKey]) {
          weekMap[weekKey] = 0;
        }
        weekMap[weekKey] += 1;
      });

      const weeks = Object.keys(weekMap).sort();

      return {
        weeks,
        counts: weeks.map((week) => weekMap[week]),
      };
    },
  );

export const selectThroughputData = makeSelectThroughputData();

// WIP Aging 데이터 (진행 중 카드의 체류 일수)
export const makeSelectWipAgingData = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Board, Card }, id) => {
      if (!id) {
        return id;
      }

      const boardModel = Board.withId(id);

      if (!boardModel) {
        return boardModel;
      }

      const now = new Date();
      const activeCards = Card.filter({ boardId: id })
        .toModelArray()
        .filter(
          (card) =>
            (card.completedAt === null || card.completedAt === undefined) && card.listId !== null,
        );

      if (activeCards.length === 0) {
        return null;
      }

      return activeCards.map((card) => {
        const listChangedAt = new Date(card.listChangedAt || card.createdAt);
        const ageDays = Math.max(0, Math.ceil((now - listChangedAt) / (1000 * 60 * 60 * 24)));

        return {
          cardId: card.id,
          cardName: card.name,
          listId: card.listId,
          ageDays,
        };
      });
    },
  );

export const selectWipAgingData = makeSelectWipAgingData();

// Little's Law 요약 데이터
export const makeSelectSummaryData = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ Card }, id) => {
      if (!id) {
        return id;
      }

      // 현재 진행 중 카드 수 (WIP)
      const activeCards = Card.filter({ boardId: id })
        .toModelArray()
        .filter((card) => card.completedAt === null || card.completedAt === undefined);

      const avgWip = activeCards.length;

      // 완료된 카드로 Delivery Rate 계산
      const completedCards = Card.filter({ boardId: id })
        .toModelArray()
        .filter((card) => card.completedAt !== null && card.completedAt !== undefined);

      if (completedCards.length === 0) {
        return {
          avgWip,
          deliveryRate: 0,
          expectedLeadTime: null,
        };
      }

      // 완료 카드의 날짜 범위로 일 평균 Delivery Rate 계산
      const completedDates = completedCards.map((card) => new Date(card.completedAt));
      const minDate = new Date(Math.min(...completedDates));
      const maxDate = new Date(Math.max(...completedDates));
      const daySpan = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));

      const deliveryRate = completedCards.length / daySpan;
      const expectedLeadTime = deliveryRate > 0 ? Math.round(avgWip / deliveryRate) : null;

      return {
        avgWip,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        expectedLeadTime,
      };
    },
  );

export const selectSummaryData = makeSelectSummaryData();

export default {
  makeSelectCfdData,
  selectCfdData,
  makeSelectLeadTimeData,
  selectLeadTimeData,
  makeSelectThroughputData,
  selectThroughputData,
  makeSelectWipAgingData,
  selectWipAgingData,
  makeSelectSummaryData,
  selectSummaryData,
};
