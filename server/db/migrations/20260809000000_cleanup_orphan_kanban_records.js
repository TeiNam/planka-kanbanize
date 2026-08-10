/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * 칸반 확장 테이블의 고아 레코드 정리.
 *
 * 확장 테이블(blocker, card_commitment_log, card_movement_log, card_relationship,
 * commitment_point, board_daily_snapshot, swim_lane)은 FK CASCADE 없이 도입되어,
 * 카드/리스트/보드 삭제 시 참조가 끊긴 레코드가 남아 있을 수 있다.
 * (예: 고아 blocker 는 blockers API 전체를 pathNotFound 로 깨뜨린다.)
 *
 * 이 마이그레이션 이후로는 delete-related 헬퍼들이 앱 레벨에서 함께 정리하므로
 * 새 고아는 생기지 않는다. 여기서는 기존에 쌓인 고아만 지운다.
 * 삭제 대상은 "존재하지 않는 엔티티를 참조하는 행"뿐이므로 데이터 손실이 없다.
 */

module.exports.up = async (knex) => {
  // 호스트 카드가 삭제된 블로커 (blocker_linked_card 는 FK CASCADE 로 함께 삭제됨)
  // 참고: 레거시 blocker.linked_card_id 컬럼은 20260513001608 에서 이미 제거됨.
  await knex.raw(`
    DELETE FROM blocker b
    WHERE NOT EXISTS (SELECT 1 FROM card c WHERE c.id = b.card_id)
  `);

  await knex.raw(`
    DELETE FROM card_commitment_log l
    WHERE NOT EXISTS (SELECT 1 FROM card c WHERE c.id = l.card_id)
  `);

  await knex.raw(`
    DELETE FROM card_movement_log l
    WHERE NOT EXISTS (SELECT 1 FROM card c WHERE c.id = l.card_id)
  `);

  await knex.raw(`
    DELETE FROM card_relationship r
    WHERE NOT EXISTS (SELECT 1 FROM card c WHERE c.id = r.parent_card_id)
       OR NOT EXISTS (SELECT 1 FROM card c WHERE c.id = r.child_card_id)
  `);

  await knex.raw(`
    DELETE FROM commitment_point p
    WHERE NOT EXISTS (SELECT 1 FROM board b WHERE b.id = p.board_id)
       OR NOT EXISTS (SELECT 1 FROM list l WHERE l.id = p.left_list_id)
       OR NOT EXISTS (SELECT 1 FROM list l WHERE l.id = p.right_list_id)
  `);

  await knex.raw(`
    DELETE FROM board_daily_snapshot s
    WHERE NOT EXISTS (SELECT 1 FROM board b WHERE b.id = s.board_id)
       OR NOT EXISTS (SELECT 1 FROM list l WHERE l.id = s.list_id)
  `);

  await knex.raw(`
    DELETE FROM swim_lane s
    WHERE NOT EXISTS (SELECT 1 FROM board b WHERE b.id = s.board_id)
  `);
};

// 삭제된 고아 레코드는 복원할 수 없고 복원할 이유도 없다 (참조가 이미 끊긴 데이터).
module.exports.down = () => Promise.resolve();
