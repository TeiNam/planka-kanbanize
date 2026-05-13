/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/closeplanka/blob/master/LICENSE.md
 */

/**
 * list.type 'active' 를 'backlog' / 'task' / 'discard' 로 분리.
 *
 * 변환 규칙:
 * - 보드별 가장 왼쪽(position 최소)의 type='active' 리스트 1개 → 'backlog'
 * - 같은 보드의 나머지 type='active' 리스트 → 'task'
 * - parent_list_id가 있는 서브컬럼은 부모와 함께 'task'로 통일
 * - sub_column_type='active' 컬럼명은 의미 충돌 없음 (별도 컬럼이라 그대로 유지)
 *
 * down 마이그레이션은 backlog/task/discard 모두 'active'로 되돌린다.
 */

exports.up = async (knex) => {
  // 1) 보드별 가장 왼쪽(parent_list_id IS NULL, position 최소) active 리스트를 backlog로
  await knex.raw(`
    WITH leftmost AS (
      SELECT DISTINCT ON (board_id) id
      FROM list
      WHERE type = 'active' AND parent_list_id IS NULL
      ORDER BY board_id, position NULLS LAST, id
    )
    UPDATE list
    SET type = 'backlog'
    WHERE id IN (SELECT id FROM leftmost)
  `);

  // 2) 나머지 active 리스트(부모/서브컬럼 모두) → task
  await knex.raw(`
    UPDATE list
    SET type = 'task'
    WHERE type = 'active'
  `);
};

exports.down = async (knex) => {
  // backlog / task / discard 를 모두 active 로 되돌림
  await knex.raw(`
    UPDATE list
    SET type = 'active'
    WHERE type IN ('backlog', 'task', 'discard')
  `);
};
