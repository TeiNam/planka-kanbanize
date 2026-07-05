/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * 공휴일 API 인증이 URL-only 에서 X-API-Key 헤더 방식으로 바뀌면서
 * project 에 holiday_api_key(text, nullable) 를 추가한다.
 *
 * 키는 서버 전용(write-only) 이므로 컬럼만 추가하고 클라이언트 노출은
 * Project 모델의 customToJSON 에서 차단한다.
 */

module.exports.up = (knex) =>
  knex.schema.alterTable('project', (table) => {
    table.text('holiday_api_key');
  });

module.exports.down = (knex) =>
  knex.schema.alterTable('project', (table) => {
    table.dropColumn('holiday_api_key');
  });
