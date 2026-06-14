/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * board 테이블에 캘린더 설정 컬럼 추가.
 *
 * holiday_api_endpoint : 공휴일 조회에 사용할 외부 API 기본 URL (nullable).
 *                        미설정 시 캘린더 보드에서 공휴일을 표시하지 않음 (R9).
 */

exports.up = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.text('holiday_api_endpoint');
  });

exports.down = (knex) =>
  knex.schema.alterTable('board', (table) => {
    table.dropColumn('holiday_api_endpoint');
  });
