-- Lead Time / Little's Law 보강
-- - Commitment Point: BackLog → 분석 사이에 1개 (commitment 타입)
-- - 진행/완료 카드 모두에 forward log를 박아서 lead time이 산출되게

DO $$
DECLARE
  v_board_id BIGINT := 1773625427445679116;
  v_backlog_id BIGINT := 1773748620487558276;
  v_analysis_id BIGINT := 1773748781221676165;
  v_cp_id BIGINT;
BEGIN
  -- Commitment Point: BackLog ↔ 분석 (단순화: cards.id에 unique 제약 없으므로 동일 cp 1개)
  v_cp_id := next_id();
  INSERT INTO commitment_point (id, board_id, left_list_id, right_list_id, position, type, created_at)
    VALUES (v_cp_id, v_board_id, v_backlog_id, v_analysis_id, 65536, 'commitment', NOW())
    ON CONFLICT (board_id, left_list_id, right_list_id) DO NOTHING;

  -- 위에서 ON CONFLICT면 기존 cp_id를 다시 가져옴
  SELECT id INTO v_cp_id FROM commitment_point
    WHERE board_id = v_board_id AND left_list_id = v_backlog_id AND right_list_id = v_analysis_id;

  -- BackLog → 분석 이동 로그가 있는 카드들에 대해, 그 시점을 forward 통과로 기록
  INSERT INTO card_commitment_log (id, card_id, commitment_point_id, direction, passed_at, created_at)
  SELECT next_id(), m.card_id, v_cp_id, 'forward', m.moved_at, m.moved_at
  FROM card_movement_log m
  WHERE m.board_id = v_board_id
    AND m.from_list_id = v_backlog_id
    AND m.to_list_id = v_analysis_id;

  RAISE NOTICE 'Commitment log 추가 완료';
END $$;
