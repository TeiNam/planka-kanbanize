/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * Commitment Point 및 카드 이동 이력 마이그레이션
 *
 * 신규 테이블:
 * - commitment_point: Commitment/Delivery Point 정의
 * - card_commitment_log: 카드의 Commitment Point 통과 기록
 * - card_movement_log: 카드 컬럼 이동 이력 (Lead Time 계산용)
 *
 * Requirements: 3.1, 3.4, 6.3
 */

exports.up = async (knex) => {
  // Commitment Point 테이블 생성
  await knex.schema.createTable('commitment_point', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('board_id').notNullable();
    table.bigInteger('left_list_id').notNullable();
    table.bigInteger('right_list_id').notNullable();
    table.specificType('position', 'double precision').notNullable();
    table.text('label');
    table.text('type').notNullable().defaultTo('commitment');

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('board_id');
    table.unique(['board_id', 'left_list_id', 'right_list_id']);
  });

  // 카드 Commitment Point 통과 기록 테이블 생성
  await knex.schema.createTable('card_commitment_log', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('card_id').notNullable();
    table.bigInteger('commitment_point_id').notNullable();
    table.text('direction').notNullable().defaultTo('forward');
    table.timestamp('passed_at', true).notNullable();

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('card_id');
    table.index('commitment_point_id');
    table.index('passed_at');
    table.index(['card_id', 'commitment_point_id']);
  });

  // 카드 이동 이력 테이블 생성
  await knex.schema.createTable('card_movement_log', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('card_id').notNullable();
    table.bigInteger('board_id').notNullable();
    table.bigInteger('from_list_id');
    table.bigInteger('to_list_id');
    table.bigInteger('from_swim_lane_id');
    table.bigInteger('to_swim_lane_id');
    table.bigInteger('user_id');
    table.timestamp('moved_at', true).notNullable();

    table.timestamp('created_at', true);

    /* Indexes */

    table.index('card_id');
    table.index('board_id');
    table.index('moved_at');
    table.index(['card_id', 'moved_at']);
    table.index(['board_id', 'moved_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('card_movement_log');
  await knex.schema.dropTable('card_commitment_log');
  await knex.schema.dropTable('commitment_point');
};
