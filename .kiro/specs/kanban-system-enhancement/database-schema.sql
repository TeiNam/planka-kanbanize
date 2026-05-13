-- ============================================================
-- 칸반 시스템 고도화 (Kanban System Enhancement) - DB 스키마 변경
-- Planka PostgreSQL Database
-- ============================================================

-- ============================================================
-- 1. 스윔레인 (Swim Lanes) 테이블
-- ============================================================

CREATE TABLE swim_lane (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    board_id BIGINT NOT NULL,

    position DOUBLE PRECISION NOT NULL,
    name TEXT NOT NULL,
    -- 카테고리: 'work_item_type', 'class_of_service', 'requestor', 'project'
    category TEXT,
    -- 스윔레인 유형: 'standard', 'expedite'
    type TEXT NOT NULL DEFAULT 'standard',
    wip_limit INTEGER,
    color TEXT,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX swim_lane_board_id_index ON swim_lane (board_id);
CREATE INDEX swim_lane_position_index ON swim_lane (position);
CREATE INDEX swim_lane_type_index ON swim_lane (type);

-- 카드에 스윔레인 참조 추가
ALTER TABLE card ADD COLUMN swim_lane_id BIGINT;
CREATE INDEX card_swim_lane_id_index ON card (swim_lane_id);

-- ============================================================
-- 2. WIP 제한 (WIP Limit) - list 테이블 확장
-- ============================================================

ALTER TABLE list ADD COLUMN wip_limit INTEGER;
-- 서브컬럼 유형: NULL(일반), 'active', 'done'
ALTER TABLE list ADD COLUMN sub_column_type TEXT;
-- 부모 컬럼 ID (서브컬럼인 경우)
ALTER TABLE list ADD COLUMN parent_list_id BIGINT;
-- 버퍼 컬럼 여부
ALTER TABLE list ADD COLUMN is_buffer BOOLEAN NOT NULL DEFAULT FALSE;
-- Pull Criteria 텍스트
ALTER TABLE list ADD COLUMN pull_criteria TEXT;
-- Policy 텍스트
ALTER TABLE list ADD COLUMN policy TEXT;

CREATE INDEX list_parent_list_id_index ON list (parent_list_id);

-- 보드에 시스템 레벨 WIP 제한 추가
ALTER TABLE board ADD COLUMN system_wip_limit INTEGER;

-- ============================================================
-- 3. Commitment Point (약속 지점) 테이블
-- ============================================================

CREATE TABLE commitment_point (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    board_id BIGINT NOT NULL,

    -- Commitment Point가 위치하는 두 컬럼 사이
    -- left_list_id 컬럼과 right_list_id 컬럼 사이에 구분선 표시
    left_list_id BIGINT NOT NULL,
    right_list_id BIGINT NOT NULL,
    position DOUBLE PRECISION NOT NULL,
    label TEXT,
    -- 유형: 'commitment', 'delivery'
    type TEXT NOT NULL DEFAULT 'commitment',

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX commitment_point_board_id_index ON commitment_point (board_id);
CREATE INDEX commitment_point_position_index ON commitment_point (position);

-- 카드의 Commitment Point 통과 기록
CREATE TABLE card_commitment_log (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    card_id BIGINT NOT NULL,
    commitment_point_id BIGINT NOT NULL,

    -- 'forward' (정방향 통과), 'backward' (역방향 이동)
    direction TEXT NOT NULL DEFAULT 'forward',
    passed_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX card_commitment_log_card_id_index ON card_commitment_log (card_id);
CREATE INDEX card_commitment_log_commitment_point_id_index ON card_commitment_log (commitment_point_id);
CREATE INDEX card_commitment_log_passed_at_index ON card_commitment_log (passed_at);

-- ============================================================
-- 4. 서비스 클래스 (Classes of Service) 테이블
-- ============================================================

CREATE TABLE class_of_service (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    board_id BIGINT NOT NULL,

    name TEXT NOT NULL,
    -- 기본 4가지: 'expedite', 'fixed_date', 'standard', 'intangible'
    -- 사용자 정의: 'custom'
    type TEXT NOT NULL DEFAULT 'custom',
    color TEXT NOT NULL,
    -- 처리 정책 텍스트
    policy TEXT,
    position DOUBLE PRECISION NOT NULL,
    -- 시스템 기본 클래스 여부 (삭제 불가)
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX class_of_service_board_id_index ON class_of_service (board_id);
CREATE INDEX class_of_service_type_index ON class_of_service (type);
CREATE INDEX class_of_service_position_index ON class_of_service (position);

-- 카드에 서비스 클래스 참조 추가
ALTER TABLE card ADD COLUMN class_of_service_id BIGINT;
CREATE INDEX card_class_of_service_id_index ON card (class_of_service_id);

-- ============================================================
-- 5. 카드 정보 강화 - card 테이블 확장
-- ============================================================

-- 우선순위 레벨: 'H', 'M', 'L' 또는 NULL
ALTER TABLE card ADD COLUMN priority TEXT;
-- 시작 날짜
ALTER TABLE card ADD COLUMN start_date TIMESTAMP;
-- 완료 날짜 (Delivery Point 통과 시 자동 기록)
ALTER TABLE card ADD COLUMN completed_at TIMESTAMP;

CREATE INDEX card_priority_index ON card (priority);
CREATE INDEX card_start_date_index ON card (start_date);
CREATE INDEX card_completed_at_index ON card (completed_at);

-- ============================================================
-- 6. 데코레이터 (Decorators) 테이블
-- ============================================================

CREATE TABLE decorator (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    board_id BIGINT NOT NULL,

    name TEXT NOT NULL,
    -- 아이콘 유형: 'star', 'circle', 'triangle', 'diamond', 'square'
    icon TEXT NOT NULL,
    color TEXT,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX decorator_board_id_index ON decorator (board_id);

-- 카드-데코레이터 연결 (다대다)
CREATE TABLE card_decorator (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    card_id BIGINT NOT NULL,
    decorator_id BIGINT NOT NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX card_decorator_unique ON card_decorator (card_id, decorator_id);
CREATE INDEX card_decorator_decorator_id_index ON card_decorator (decorator_id);

-- ============================================================
-- 7. 블로커 (Blockers) 테이블
-- ============================================================

CREATE TABLE blocker (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    card_id BIGINT NOT NULL,
    -- 블로커 해결을 위해 생성된 카드 (NULL이면 연결 카드 없음)
    linked_card_id BIGINT,
    creator_user_id BIGINT,

    reason TEXT NOT NULL,
    -- 상태: 'active', 'resolved'
    status TEXT NOT NULL DEFAULT 'active',

    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX blocker_card_id_index ON blocker (card_id);
CREATE INDEX blocker_linked_card_id_index ON blocker (linked_card_id);
CREATE INDEX blocker_status_index ON blocker (status);

-- ============================================================
-- 8. 하위 티켓 (Sub-tickets) - card_relationship 테이블
-- ============================================================

CREATE TABLE card_relationship (
    id BIGINT PRIMARY KEY DEFAULT next_id(),

    -- 상위 카드
    parent_card_id BIGINT NOT NULL,
    -- 하위 카드
    child_card_id BIGINT NOT NULL,
    -- 관계 유형: 'sub_ticket', 'blocker', 'related'
    type TEXT NOT NULL DEFAULT 'sub_ticket',
    position DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX card_relationship_unique ON card_relationship (parent_card_id, child_card_id, type);
CREATE INDEX card_relationship_parent_card_id_index ON card_relationship (parent_card_id);
CREATE INDEX card_relationship_child_card_id_index ON card_relationship (child_card_id);
CREATE INDEX card_relationship_type_index ON card_relationship (type);

-- ============================================================
-- 9. 칸반 메트릭 - 일별 스냅샷 테이블 (CFD 데이터 소스)
-- ============================================================

CREATE TABLE board_daily_snapshot (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    board_id BIGINT NOT NULL,
    list_id BIGINT NOT NULL,

    -- 해당 날짜의 해당 컬럼 카드 수
    card_count INTEGER NOT NULL DEFAULT 0,
    -- 스냅샷 날짜 (일 단위)
    snapshot_date DATE NOT NULL,

    created_at TIMESTAMP
);

CREATE UNIQUE INDEX board_daily_snapshot_unique ON board_daily_snapshot (board_id, list_id, snapshot_date);
CREATE INDEX board_daily_snapshot_board_id_index ON board_daily_snapshot (board_id);
CREATE INDEX board_daily_snapshot_snapshot_date_index ON board_daily_snapshot (snapshot_date);

-- ============================================================
-- 10. 카드 컬럼 이동 이력 (Lead Time 계산용)
-- ============================================================

CREATE TABLE card_movement_log (
    id BIGINT PRIMARY KEY DEFAULT next_id(),
    card_id BIGINT NOT NULL,
    board_id BIGINT NOT NULL,

    from_list_id BIGINT,
    to_list_id BIGINT NOT NULL,
    from_swim_lane_id BIGINT,
    to_swim_lane_id BIGINT,
    user_id BIGINT,

    moved_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP
);

CREATE INDEX card_movement_log_card_id_index ON card_movement_log (card_id);
CREATE INDEX card_movement_log_board_id_index ON card_movement_log (board_id);
CREATE INDEX card_movement_log_moved_at_index ON card_movement_log (moved_at);
CREATE INDEX card_movement_log_to_list_id_index ON card_movement_log (to_list_id);

-- ============================================================
-- 요약: 새로 생성되는 테이블
-- ============================================================
-- 1. swim_lane              - 스윔레인
-- 2. commitment_point       - Commitment/Delivery Point
-- 3. card_commitment_log    - 카드의 Commitment Point 통과 기록
-- 4. class_of_service       - 서비스 클래스 정의
-- 5. decorator              - 데코레이터 정의
-- 6. card_decorator         - 카드-데코레이터 연결
-- 7. blocker                - 블로커
-- 8. card_relationship      - 카드 간 관계 (하위 티켓, 블로커 연결, 관련)
-- 9. board_daily_snapshot   - CFD용 일별 스냅샷
-- 10. card_movement_log     - 카드 이동 이력 (Lead Time 계산)

-- ============================================================
-- 요약: 기존 테이블 변경사항
-- ============================================================
-- card 테이블:
--   + swim_lane_id (BIGINT)
--   + class_of_service_id (BIGINT)
--   + priority (TEXT)
--   + start_date (TIMESTAMP)
--   + completed_at (TIMESTAMP)
--
-- list 테이블:
--   + wip_limit (INTEGER)
--   + sub_column_type (TEXT)
--   + parent_list_id (BIGINT)
--   + is_buffer (BOOLEAN)
--   + pull_criteria (TEXT)
--   + policy (TEXT)
--
-- board 테이블:
--   + system_wip_limit (INTEGER)
