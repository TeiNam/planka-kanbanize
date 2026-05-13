/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/closeplanka/blob/master/LICENSE.md
 */

/**
 * board 테이블에 wip_limit_mode 컬럼 추가.
 *
 * 'warn'  : WIP 초과 시 경고만 (기본값, 기존 동작)
 * 'block' : WIP 초과 시 카드 이동 차단 (서버 거부)
 */

exports.up = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.text('wip_limit_mode').notNullable().defaultTo('warn');
  });

exports.down = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.dropColumn('wip_limit_mode');
  });
