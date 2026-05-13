/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * list 테이블에 swim_lane_id 컬럼 추가.
 *
 * - NULL: 일반 보드 / 스윔레인이 모두 표준일 때 모든 레인이 공유하는 컬럼
 * - 값 있음: 특정 스윔레인(예: Expedite)에만 속하는 컬럼 — 그 레인 내에서만 표시
 */

exports.up = (knex) =>
  knex.schema.alterTable('list', (table) => {
    table.bigInteger('swim_lane_id');
    table.index('swim_lane_id');
  });

exports.down = (knex) =>
  knex.schema.alterTable('list', (table) => {
    table.dropColumn('swim_lane_id');
  });
