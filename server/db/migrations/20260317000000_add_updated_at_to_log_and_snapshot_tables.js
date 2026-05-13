/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Sails의 전역 모델 설정이 모든 테이블에 updatedAt 속성을 주입하기 때문에,
// 초기 마이그레이션에서 updated_at 컬럼을 누락한 로그/스냅샷 테이블들에
// 해당 컬럼을 추가한다. 없으면 SELECT 시점에 "column updated_at does not exist" 에러 발생.

exports.up = async (knex) => {
  await knex.schema.alterTable('board_daily_snapshot', (table) => {
    table.timestamp('updated_at', true);
  });

  await knex.schema.alterTable('card_movement_log', (table) => {
    table.timestamp('updated_at', true);
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('card_movement_log', (table) => {
    table.dropColumn('updated_at');
  });

  await knex.schema.alterTable('board_daily_snapshot', (table) => {
    table.dropColumn('updated_at');
  });
};
