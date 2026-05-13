-- 메트릭 더미 데이터 시드
-- 보드: 1773625427445679116 (테스트 보드 스윔레인 적용)
-- 사용자: 1773485782212805633 (admin)
-- 표준 보드(swim_lane_id=null) 컬럼 사용

DO $$
DECLARE
  v_board_id BIGINT := 1773625427445679116;
  v_user_id BIGINT := 1773485782212805633;
  v_backlog_id BIGINT := 1773748620487558276;
  v_analysis_id BIGINT := 1773748781221676165;
  v_dev_id BIGINT := 1773748811487773830;
  v_qa_id BIGINT := 1773748911026996359;
  v_uat_id BIGINT := 1773750098770003080;
  v_done_id BIGINT := 1773750292756563083;

  v_card_id BIGINT;
  v_card_idx INT;
  v_days_ago INT;
  v_create_at TIMESTAMP;
  v_t1 TIMESTAMP; -- backlog→analysis
  v_t2 TIMESTAMP; -- analysis→dev
  v_t3 TIMESTAMP; -- dev→qa
  v_t4 TIMESTAMP; -- qa→uat
  v_t5 TIMESTAMP; -- uat→done
  v_lead_days INT;
BEGIN
  -- 1) 30개 카드 생성 + 이동 이력
  -- 카드 25개는 완료, 5개는 진행 중 (각 단계에 분산)
  FOR v_card_idx IN 1..30 LOOP
    v_card_id := next_id();
    -- 30~5일 전 사이 무작위 생성
    v_days_ago := 30 - ((v_card_idx - 1) * 30 / 30);
    v_create_at := NOW() - (v_days_ago || ' days')::INTERVAL;

    -- 이동 시점들 (lead time 3~14일 사이)
    v_lead_days := 3 + (v_card_idx % 12);
    v_t1 := v_create_at + INTERVAL '4 hours';
    v_t2 := v_t1 + ((v_lead_days * 0.2)::INT || ' days')::INTERVAL;
    v_t3 := v_t1 + ((v_lead_days * 0.5)::INT || ' days')::INTERVAL;
    v_t4 := v_t1 + ((v_lead_days * 0.75)::INT || ' days')::INTERVAL;
    v_t5 := v_t1 + (v_lead_days || ' days')::INTERVAL;

    -- 진행 단계: 25개는 완료, 나머지 5개는 각 단계
    IF v_card_idx <= 25 THEN
      -- 완료 카드
      INSERT INTO card (
        id, board_id, list_id, creator_user_id, type, position, name,
        created_at, updated_at, list_changed_at, comments_total, is_closed,
        is_due_completed, start_date, completed_at
      ) VALUES (
        v_card_id, v_board_id, v_done_id, v_user_id, 'project',
        65536 * v_card_idx, '더미카드 #' || v_card_idx,
        v_create_at, v_t5, v_t5, 0, true, false, v_t1, v_t5
      );

      -- 이동 로그
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_backlog_id, v_analysis_id, v_user_id, v_t1, v_t1);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_analysis_id, v_dev_id, v_user_id, v_t2, v_t2);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_dev_id, v_qa_id, v_user_id, v_t3, v_t3);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_qa_id, v_uat_id, v_user_id, v_t4, v_t4);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_uat_id, v_done_id, v_user_id, v_t5, v_t5);

    ELSIF v_card_idx = 26 THEN
      -- 분석 단계
      INSERT INTO card (
        id, board_id, list_id, creator_user_id, type, position, name,
        created_at, updated_at, list_changed_at, comments_total, is_closed,
        is_due_completed, start_date
      ) VALUES (
        v_card_id, v_board_id, v_analysis_id, v_user_id, 'project',
        65536 * v_card_idx, '진행중카드 분석',
        v_create_at, v_t1, v_t1, 0, false, false, v_t1
      );
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_backlog_id, v_analysis_id, v_user_id, v_t1, v_t1);

    ELSIF v_card_idx = 27 THEN
      -- 개발 단계
      INSERT INTO card (
        id, board_id, list_id, creator_user_id, type, position, name,
        created_at, updated_at, list_changed_at, comments_total, is_closed,
        is_due_completed, start_date
      ) VALUES (
        v_card_id, v_board_id, v_dev_id, v_user_id, 'project',
        65536 * v_card_idx, '진행중카드 개발',
        v_create_at, v_t2, v_t2, 0, false, false, v_t1
      );
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_backlog_id, v_analysis_id, v_user_id, v_t1, v_t1);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_analysis_id, v_dev_id, v_user_id, v_t2, v_t2);

    ELSIF v_card_idx = 28 THEN
      -- QA 단계
      INSERT INTO card (
        id, board_id, list_id, creator_user_id, type, position, name,
        created_at, updated_at, list_changed_at, comments_total, is_closed,
        is_due_completed, start_date
      ) VALUES (
        v_card_id, v_board_id, v_qa_id, v_user_id, 'project',
        65536 * v_card_idx, '진행중카드 QA',
        v_create_at, v_t3, v_t3, 0, false, false, v_t1
      );
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_backlog_id, v_analysis_id, v_user_id, v_t1, v_t1);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_analysis_id, v_dev_id, v_user_id, v_t2, v_t2);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_dev_id, v_qa_id, v_user_id, v_t3, v_t3);

    ELSIF v_card_idx = 29 THEN
      -- UAT 단계
      INSERT INTO card (
        id, board_id, list_id, creator_user_id, type, position, name,
        created_at, updated_at, list_changed_at, comments_total, is_closed,
        is_due_completed, start_date
      ) VALUES (
        v_card_id, v_board_id, v_uat_id, v_user_id, 'project',
        65536 * v_card_idx, '진행중카드 UAT',
        v_create_at, v_t4, v_t4, 0, false, false, v_t1
      );
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_backlog_id, v_analysis_id, v_user_id, v_t1, v_t1);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_analysis_id, v_dev_id, v_user_id, v_t2, v_t2);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_dev_id, v_qa_id, v_user_id, v_t3, v_t3);
      INSERT INTO card_movement_log (id, card_id, board_id, from_list_id, to_list_id, user_id, moved_at, created_at)
        VALUES (next_id(), v_card_id, v_board_id, v_qa_id, v_uat_id, v_user_id, v_t4, v_t4);

    ELSE
      -- 백로그
      INSERT INTO card (
        id, board_id, list_id, creator_user_id, type, position, name,
        created_at, updated_at, list_changed_at, comments_total, is_closed,
        is_due_completed
      ) VALUES (
        v_card_id, v_board_id, v_backlog_id, v_user_id, 'project',
        65536 * v_card_idx, '백로그카드',
        v_create_at, v_create_at, v_create_at, 0, false, false
      );
    END IF;
  END LOOP;

  -- 2) 30일치 일별 스냅샷 — CFD용
  -- 단순화: 매일 각 컬럼의 카드 수를 집계해서 저장
  FOR v_days_ago IN 0..29 LOOP
    DECLARE
      v_date DATE := (NOW() - (v_days_ago || ' days')::INTERVAL)::DATE;
      v_endofday TIMESTAMP := v_date + INTERVAL '23 hours 59 minutes';
      v_count INT;
    BEGIN
      -- 각 컬럼별 그 시점의 카드 수 집계 (movement log를 활용한 추정)
      -- backlog
      SELECT COUNT(*) INTO v_count
      FROM card c
      WHERE c.board_id = v_board_id
        AND c.created_at <= v_endofday
        AND NOT EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.from_list_id = v_backlog_id AND m.moved_at <= v_endofday
        );
      INSERT INTO board_daily_snapshot (id, board_id, list_id, card_count, snapshot_date, created_at)
        VALUES (next_id(), v_board_id, v_backlog_id, v_count, v_date, NOW())
        ON CONFLICT DO NOTHING;

      -- 분석
      SELECT COUNT(DISTINCT c.id) INTO v_count
      FROM card c
      WHERE c.board_id = v_board_id
        AND EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.to_list_id = v_analysis_id AND m.moved_at <= v_endofday
        )
        AND NOT EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.from_list_id = v_analysis_id AND m.moved_at <= v_endofday
        );
      INSERT INTO board_daily_snapshot (id, board_id, list_id, card_count, snapshot_date, created_at)
        VALUES (next_id(), v_board_id, v_analysis_id, v_count, v_date, NOW())
        ON CONFLICT DO NOTHING;

      -- 개발
      SELECT COUNT(DISTINCT c.id) INTO v_count
      FROM card c
      WHERE c.board_id = v_board_id
        AND EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.to_list_id = v_dev_id AND m.moved_at <= v_endofday
        )
        AND NOT EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.from_list_id = v_dev_id AND m.moved_at <= v_endofday
        );
      INSERT INTO board_daily_snapshot (id, board_id, list_id, card_count, snapshot_date, created_at)
        VALUES (next_id(), v_board_id, v_dev_id, v_count, v_date, NOW())
        ON CONFLICT DO NOTHING;

      -- QA
      SELECT COUNT(DISTINCT c.id) INTO v_count
      FROM card c
      WHERE c.board_id = v_board_id
        AND EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.to_list_id = v_qa_id AND m.moved_at <= v_endofday
        )
        AND NOT EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.from_list_id = v_qa_id AND m.moved_at <= v_endofday
        );
      INSERT INTO board_daily_snapshot (id, board_id, list_id, card_count, snapshot_date, created_at)
        VALUES (next_id(), v_board_id, v_qa_id, v_count, v_date, NOW())
        ON CONFLICT DO NOTHING;

      -- UAT
      SELECT COUNT(DISTINCT c.id) INTO v_count
      FROM card c
      WHERE c.board_id = v_board_id
        AND EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.to_list_id = v_uat_id AND m.moved_at <= v_endofday
        )
        AND NOT EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.from_list_id = v_uat_id AND m.moved_at <= v_endofday
        );
      INSERT INTO board_daily_snapshot (id, board_id, list_id, card_count, snapshot_date, created_at)
        VALUES (next_id(), v_board_id, v_uat_id, v_count, v_date, NOW())
        ON CONFLICT DO NOTHING;

      -- Done
      SELECT COUNT(DISTINCT c.id) INTO v_count
      FROM card c
      WHERE c.board_id = v_board_id
        AND EXISTS (
          SELECT 1 FROM card_movement_log m
          WHERE m.card_id = c.id AND m.to_list_id = v_done_id AND m.moved_at <= v_endofday
        );
      INSERT INTO board_daily_snapshot (id, board_id, list_id, card_count, snapshot_date, created_at)
        VALUES (next_id(), v_board_id, v_done_id, v_count, v_date, NOW())
        ON CONFLICT DO NOTHING;
    END;
  END LOOP;

  RAISE NOTICE '시드 완료: 30 카드 + 이동 로그 + 30일 스냅샷';
END $$;
