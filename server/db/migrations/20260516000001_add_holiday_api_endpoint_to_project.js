/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * 공휴일 API endpoint 설정을 board → project 로 이전한다.
 *
 * up:
 *   1) project 에 holiday_api_endpoint(text, nullable) 추가
 *   2) 프로젝트 내 endpoint 가 설정된 보드가 있으면 그 값을 project 로 백필(임의 1건)
 *   3) board 의 holiday_api_endpoint 제거
 *
 * down:
 *   board 에 holiday_api_endpoint 복원, project 에서 제거.
 */

module.exports.up = async (knex) => {
  // 1) project 에 holiday_api_endpoint 추가
  await knex.schema.alterTable('project', (table) => {
    table.text('holiday_api_endpoint');
  });

  // 2) 프로젝트 내 보드 중 endpoint 가 설정된 값을 백필(임의 1건)
  await knex.raw(
    'UPDATE project SET holiday_api_endpoint = (SELECT holiday_api_endpoint FROM board WHERE board.project_id = project.id AND holiday_api_endpoint IS NOT NULL LIMIT 1)',
  );

  // 3) board 의 holiday_api_endpoint 제거
  await knex.schema.alterTable('board', (table) => {
    table.dropColumn('holiday_api_endpoint');
  });
};

module.exports.down = async (knex) => {
  // board 에 holiday_api_endpoint 복원
  await knex.schema.alterTable('board', (table) => {
    table.text('holiday_api_endpoint');
  });

  // project 에서 제거
  await knex.schema.alterTable('project', (table) => {
    table.dropColumn('holiday_api_endpoint');
  });
};
