/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports.up = async (knex) => {
  // 캘린더 일정(calendar_event) 테이블 생성
  await knex.schema.createTable('calendar_event', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('board_id').notNullable();
    table.bigInteger('creator_user_id');

    table.text('name').notNullable();
    // 일정 종류: 'all_day'(하루 종일) 또는 'time_based'(시간 단위)
    table.text('event_kind').notNullable().defaultTo('all_day');
    table.timestamp('start_at', true).notNullable();
    table.timestamp('end_at', true).notNullable();
    table.text('color');

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('board_id');
    table.index('creator_user_id');
  });
};

module.exports.down = async (knex) => {
  // 캘린더 일정 테이블 삭제
  await knex.schema.dropTable('calendar_event');
};
