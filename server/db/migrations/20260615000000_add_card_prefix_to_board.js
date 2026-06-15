/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * board 테이블에 카드 말머리(prefix) 설정 컬럼 추가.
 *
 * card_prefix_enabled     : 말머리 자동 부착 사용 여부 (기본 false)
 * card_prefix             : 말머리 문자열 (예: "DB"). 한글 2자 / 영문 4자 폭 제한은 애플리케이션에서 검증
 * card_prefix_next_number : 다음 카드에 부여할 순번 (기본 1). 카드 생성 시 원자적으로 증가
 */

exports.up = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.boolean('card_prefix_enabled').notNullable().defaultTo(false);
    table.text('card_prefix').nullable();
    table.integer('card_prefix_next_number').notNullable().defaultTo(1);
  });

exports.down = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.dropColumn('card_prefix_enabled');
    table.dropColumn('card_prefix');
    table.dropColumn('card_prefix_next_number');
  });
