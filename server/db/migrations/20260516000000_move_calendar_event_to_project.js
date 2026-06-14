/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * calendar_event 의 소유권을 board → project 로 이전한다.
 *
 * up:
 *   1) project_id 컬럼 추가(nullable)
 *   2) 기존 board_id 를 통해 project_id 백필
 *   3) project_id notNullable 로 변경
 *   4) project_id 인덱스 추가, board_id 인덱스/컬럼 제거
 *
 * down:
 *   board_id 를 nullable 로 복원(백필 불가 — 프로젝트는 다수 보드를 가질 수 있어
 *   원래 보드를 신뢰성 있게 역추적할 수 없음), project_id 제거. best-effort.
 */

module.exports.up = async (knex) => {
  // 1) project_id 컬럼 추가 (우선 nullable 로 추가 후 백필)
  await knex.schema.alterTable('calendar_event', (table) => {
    table.bigInteger('project_id');
  });

  // 2) 기존 board_id → board.project_id 로 project_id 백필
  await knex.raw(
    'UPDATE calendar_event SET project_id = (SELECT project_id FROM board WHERE board.id = calendar_event.board_id)',
  );

  // 3) project_id 를 notNullable 로 변경
  await knex.schema.alterTable('calendar_event', (table) => {
    table.bigInteger('project_id').notNullable().alter();
  });

  // 4) 인덱스 정리: project_id 인덱스 추가, board_id 인덱스/컬럼 제거
  await knex.schema.alterTable('calendar_event', (table) => {
    table.index('project_id');
    table.dropIndex('board_id');
    table.dropColumn('board_id');
  });
};

module.exports.down = async (knex) => {
  // board_id 복원 (백필 불가 → nullable 로만 추가), project_id 제거
  await knex.schema.alterTable('calendar_event', (table) => {
    table.bigInteger('board_id');
  });

  await knex.schema.alterTable('calendar_event', (table) => {
    table.index('board_id');
    table.dropIndex('project_id');
    table.dropColumn('project_id');
  });
};
