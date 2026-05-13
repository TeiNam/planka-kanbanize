/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * WIP 제한 및 컬럼 구조 마이그레이션
 *
 * list 테이블 확장:
 * - wip_limit: WIP 제한값 (NULL = 무제한)
 * - sub_column_type: 서브컬럼 유형 ('active', 'done')
 * - parent_list_id: 부모 컬럼 ID (서브컬럼인 경우)
 * - is_buffer: 버퍼 컬럼 여부
 * - pull_criteria: Pull Criteria 텍스트
 * - policy: 정책 텍스트
 *
 * board 테이블 확장:
 * - system_wip_limit: 시스템 레벨 WIP 제한
 */

exports.up = async (knex) => {
  await knex.schema.alterTable('list', (table) => {
    /* Columns */

    table.integer('wip_limit');
    table.text('sub_column_type');
    table.bigInteger('parent_list_id');
    table.boolean('is_buffer').notNullable().defaultTo(false);
    table.text('pull_criteria');
    table.text('policy');

    /* Indexes */

    table.index('parent_list_id');
  });

  // 버퍼 컬럼 부분 인덱스 (is_buffer = true인 행만 인덱싱)
  await knex.raw('CREATE INDEX list_is_buffer_index ON list (is_buffer) WHERE is_buffer = true');

  return knex.schema.alterTable('board', (table) => {
    /* Columns */

    table.integer('system_wip_limit');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('board', (table) => {
    table.dropColumn('system_wip_limit');
  });

  // 부분 인덱스 삭제
  await knex.raw('DROP INDEX IF EXISTS list_is_buffer_index');

  return knex.schema.alterTable('list', (table) => {
    table.dropColumn('policy');
    table.dropColumn('pull_criteria');
    table.dropColumn('is_buffer');
    table.dropColumn('parent_list_id');
    table.dropColumn('sub_column_type');
    table.dropColumn('wip_limit');
  });
};
