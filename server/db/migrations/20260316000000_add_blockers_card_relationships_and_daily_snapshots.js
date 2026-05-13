/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

exports.up = async (knex) => {
  // 블로커 테이블 생성
  await knex.schema.createTable('blocker', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('card_id').notNullable();
    table.bigInteger('linked_card_id');
    table.bigInteger('creator_user_id');

    table.text('reason').notNullable();
    table.text('status').notNullable().defaultTo('active');
    table.timestamp('resolved_at', true);

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('card_id');
    table.index('linked_card_id');
    table.index('status');
    table.index(['card_id', 'status']);
  });

  // 카드 관계 (하위 티켓) 테이블 생성
  await knex.schema.createTable('card_relationship', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('parent_card_id').notNullable();
    table.bigInteger('child_card_id').notNullable();
    table.text('type').notNullable().defaultTo('sub_ticket');
    table.specificType('position', 'double precision').notNullable();

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.unique(['parent_card_id', 'child_card_id']);
    table.index('parent_card_id');
    table.index('child_card_id');
  });

  // 보드 일별 스냅샷 테이블 생성 (CFD 데이터 소스)
  await knex.schema.createTable('board_daily_snapshot', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('board_id').notNullable();
    table.bigInteger('list_id').notNullable();
    table.integer('card_count').notNullable().defaultTo(0);
    table.date('snapshot_date').notNullable();

    table.timestamp('created_at', true);

    /* Indexes */

    table.unique(['board_id', 'list_id', 'snapshot_date']);
    table.index('board_id');
    table.index('list_id');
    table.index('snapshot_date');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('board_daily_snapshot');
  await knex.schema.dropTable('card_relationship');
  await knex.schema.dropTable('blocker');
};
