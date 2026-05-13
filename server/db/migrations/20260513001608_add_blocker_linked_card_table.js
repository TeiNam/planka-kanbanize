/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * blocker_linked_card 조인 테이블 마이그레이션
 *
 * 블로커의 단일 linked_card_id FK 방식을 M:N 조인 테이블 구조로 전환한다.
 *
 * 변경 사항:
 * - blocker_linked_card 조인 테이블 생성
 * - 기존 blocker.linked_card_id 데이터를 blocker_linked_card로 마이그레이션
 * - blocker 테이블에서 linked_card_id 컬럼 제거
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

exports.up = async (knex) => {
  // 1. blocker_linked_card 조인 테이블 생성
  await knex.schema.createTable('blocker_linked_card', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table
      .bigInteger('blocker_id')
      .notNullable()
      .references('id')
      .inTable('blocker')
      .onDelete('CASCADE');
    table.bigInteger('card_id').notNullable().references('id').inTable('card').onDelete('CASCADE');
    table.specificType('position', 'double precision').notNullable();

    table.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', true);

    /* Indexes */

    table.unique(['blocker_id', 'card_id']);
    table.index('blocker_id');
    table.index('card_id');
  });

  // 2. 기존 linked_card_id 데이터를 blocker_linked_card로 마이그레이션
  await knex.raw(`
    INSERT INTO blocker_linked_card (blocker_id, card_id, position, created_at)
    SELECT id, linked_card_id, 65536.0, created_at
    FROM blocker
    WHERE linked_card_id IS NOT NULL
  `);

  // 3. blocker 테이블에서 linked_card_id 컬럼 제거
  await knex.schema.alterTable('blocker', (table) => {
    table.dropColumn('linked_card_id');
  });
};

exports.down = async (knex) => {
  // 1. blocker 테이블에 linked_card_id 컬럼 복원
  await knex.schema.alterTable('blocker', (table) => {
    table.bigInteger('linked_card_id');
  });

  // 2. 데이터 복원 (position 기준 첫 번째 연결만 복원)
  await knex.raw(`
    UPDATE blocker SET linked_card_id = blc.card_id
    FROM (
      SELECT DISTINCT ON (blocker_id) blocker_id, card_id
      FROM blocker_linked_card
      ORDER BY blocker_id, position ASC
    ) blc
    WHERE blocker.id = blc.blocker_id
  `);

  // 3. blocker_linked_card 조인 테이블 삭제
  await knex.schema.dropTable('blocker_linked_card');
};
