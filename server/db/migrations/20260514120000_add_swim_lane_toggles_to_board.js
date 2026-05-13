/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * board 테이블에 스윔레인/긴급 레인 토글 및 긴급 레인 WIP 컬럼 추가.
 *
 * is_swim_lanes_enabled  : 스윔레인 사용 여부 (기본 false)
 * is_expedite_lane_enabled : 긴급 레인 사용 여부 (스윔레인과 독립, 기본 false)
 * expedite_wip_limit     : 긴급 레인 WIP (기본 1, 1~2 허용)
 */

exports.up = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.boolean('is_swim_lanes_enabled').notNullable().defaultTo(false);
    table.boolean('is_expedite_lane_enabled').notNullable().defaultTo(false);
    table.integer('expedite_wip_limit').notNullable().defaultTo(1);
  });

exports.down = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.dropColumn('is_swim_lanes_enabled');
    table.dropColumn('is_expedite_lane_enabled');
    table.dropColumn('expedite_wip_limit');
  });
