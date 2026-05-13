/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports.up = async (knex) => {
  // 스윔레인 테이블 생성
  await knex.schema.createTable('swim_lane', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('board_id').notNullable();

    table.specificType('position', 'double precision').notNullable();
    table.text('name').notNullable();
    table.text('category');
    table.text('type').notNullable().defaultTo('standard');
    table.integer('wip_limit');
    table.text('color');

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('board_id');
    table.index('position');
    table.index('type');
  });

  // 서비스 클래스 테이블 생성
  await knex.schema.createTable('class_of_service', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('board_id').notNullable();

    table.text('name').notNullable();
    table.text('type').notNullable().defaultTo('custom');
    table.text('color').notNullable();
    table.text('policy');
    table.specificType('position', 'double precision').notNullable();
    table.boolean('is_default').notNullable().defaultTo(false);

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('board_id');
    table.index('type');
    table.index('position');
  });

  // 데코레이터 테이블 생성
  await knex.schema.createTable('decorator', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('board_id').notNullable();

    table.text('name').notNullable();
    table.text('icon').notNullable();
    table.text('color');

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('board_id');
  });

  // 카드-데코레이터 연결 테이블 생성 (다대다)
  await knex.schema.createTable('card_decorator', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('card_id').notNullable();
    table.bigInteger('decorator_id').notNullable();

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.unique(['card_id', 'decorator_id']);
    table.index('decorator_id');
  });

  // card 테이블에 swim_lane_id, class_of_service_id, priority, start_date, completed_at 컬럼 추가
  await knex.schema.alterTable('card', (table) => {
    /* Columns */

    table.bigInteger('swim_lane_id');
    table.bigInteger('class_of_service_id');
    table.text('priority');
    table.timestamp('start_date', true);
    table.timestamp('completed_at', true);

    /* Indexes */

    table.index('swim_lane_id');
    table.index('class_of_service_id');
    table.index('priority');
    table.index('start_date');
    table.index('completed_at');
  });
};

module.exports.down = async (knex) => {
  // card 테이블에서 추가된 컬럼 제거
  await knex.schema.alterTable('card', (table) => {
    table.dropColumn('swim_lane_id');
    table.dropColumn('class_of_service_id');
    table.dropColumn('priority');
    table.dropColumn('start_date');
    table.dropColumn('completed_at');
  });

  // 카드-데코레이터 연결 테이블 삭제
  await knex.schema.dropTable('card_decorator');

  // 데코레이터 테이블 삭제
  await knex.schema.dropTable('decorator');

  // 서비스 클래스 테이블 삭제
  await knex.schema.dropTable('class_of_service');

  // 스윔레인 테이블 삭제
  await knex.schema.dropTable('swim_lane');
};
