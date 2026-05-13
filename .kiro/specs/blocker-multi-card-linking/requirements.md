# Requirements Document

## Introduction

블로커(Blocker)에 다수의 카드를 연결할 수 있도록 기존 단일 linked_card_id 방식을 다대다(M:N) 조인 테이블 구조로 전환한다. 연결된 모든 카드가 완료되면 블로커를 자동으로 resolved 처리한다. 기존 SubTicketSection UI를 제거하고 블로커 섹션에 카드 연결 기능을 통합한다.

## Glossary

- **Blocker_System**: 카드의 진행을 차단하는 사유를 관리하는 시스템 (서버 컨트롤러, 헬퍼, 모델 포함)
- **Blocker_UI**: 블로커 정보를 표시하고 조작하는 클라이언트 UI 컴포넌트 (BlockerSection)
- **Blocker_Linked_Card_Table**: 블로커와 카드 간 다대다 관계를 저장하는 조인 테이블 (blocker_linked_card)
- **Linked_Card**: 블로커에 연결된 카드로, 해당 카드의 완료 여부가 블로커 해결 조건에 영향을 미침
- **Auto_Resolve_Service**: 연결된 카드의 완료 상태를 감지하여 블로커를 자동 resolved 처리하는 서버 로직
- **Card_Search_Dropdown**: 블로커에 연결할 카드를 검색하고 선택하는 드롭다운 UI 컴포넌트

## Requirements

### Requirement 1: 블로커 다중 카드 연결 데이터 모델

**User Story:** As a 개발자, I want 블로커가 여러 카드를 연결할 수 있는 데이터 구조를 갖추길, so that 하나의 블로커에 복수의 관련 카드를 추적할 수 있다.

#### Acceptance Criteria

1. THE Blocker_System SHALL blocker_linked_card 조인 테이블을 생성하며, 해당 테이블은 blocker_id(UUID, NOT NULL, FK), card_id(UUID, NOT NULL, FK), position(REAL, NOT NULL), created_at(TIMESTAMP, NOT NULL) 컬럼을 포함한다.
2. THE Blocker_Linked_Card_Table SHALL blocker_id와 card_id의 조합에 대해 유니크 제약 조건을 적용한다.
3. THE Blocker_Linked_Card_Table SHALL blocker_id에 대한 외래 키 제약을 설정하며, 블로커 삭제 시 CASCADE로 연결 레코드를 삭제한다.
4. THE Blocker_Linked_Card_Table SHALL card_id에 대한 외래 키 제약을 설정하며, 카드 삭제 시 CASCADE로 연결 레코드를 삭제한다.
5. THE Blocker_System SHALL 기존 blocker 테이블의 linked_card_id 컬럼을 제거하는 마이그레이션을 수행한다.
6. THE Blocker_System SHALL 기존 linked_card_id 데이터를 blocker_linked_card 테이블로 마이그레이션한다.

### Requirement 2: 블로커에 카드 연결 API

**User Story:** As a 보드 편집자, I want 블로커에 기존 카드를 연결할 수 있길, so that 블로커 해결에 필요한 작업 카드를 추적할 수 있다.

#### Acceptance Criteria

1. WHEN 카드 연결 요청이 수신되면, THE Blocker_System SHALL blocker_linked_card 테이블에 새 레코드를 생성하고 생성된 연결 정보를 반환한다.
2. WHEN 카드 연결 요청이 수신되면, THE Blocker_System SHALL 요청자가 해당 보드의 EDITOR 역할 멤버인지 검증한다.
3. IF 동일 블로커에 동일 카드가 이미 연결되어 있으면, THEN THE Blocker_System SHALL 409 Conflict 응답을 반환한다.
4. IF 요청자가 보드 멤버가 아니거나 EDITOR 역할이 아니면, THEN THE Blocker_System SHALL 403 Forbidden 응답을 반환한다.
5. WHEN 카드 연결이 생성되면, THE Blocker_System SHALL 해당 보드 구독자에게 WebSocket 이벤트를 브로드캐스트한다.

### Requirement 3: 블로커에서 카드 연결 해제 API

**User Story:** As a 보드 편집자, I want 블로커에서 연결된 카드를 제거할 수 있길, so that 더 이상 관련 없는 카드를 블로커에서 분리할 수 있다.

#### Acceptance Criteria

1. WHEN 카드 연결 해제 요청이 수신되면, THE Blocker_System SHALL blocker_linked_card 테이블에서 해당 레코드를 삭제한다.
2. WHEN 카드 연결 해제 요청이 수신되면, THE Blocker_System SHALL 요청자가 해당 보드의 EDITOR 역할 멤버인지 검증한다.
3. IF 요청자가 보드 멤버가 아니거나 EDITOR 역할이 아니면, THEN THE Blocker_System SHALL 403 Forbidden 응답을 반환한다.
4. WHEN 카드 연결이 해제되면, THE Blocker_System SHALL 해당 보드 구독자에게 WebSocket 이벤트를 브로드캐스트한다.

### Requirement 4: 연결 카드 완료 시 블로커 자동 해결

**User Story:** As a 보드 사용자, I want 블로커에 연결된 모든 카드가 완료되면 블로커가 자동으로 해결되길, so that 수동으로 블로커 상태를 변경하지 않아도 된다.

#### Acceptance Criteria

1. WHEN 연결된 카드의 완료 상태가 변경되면, THE Auto_Resolve_Service SHALL 해당 카드가 연결된 모든 활성 블로커를 조회한다.
2. WHEN 활성 블로커의 모든 연결 카드가 완료 상태이면, THE Auto_Resolve_Service SHALL 해당 블로커의 status를 resolved로, resolved_at을 현재 시각으로 즉시 업데이트한다.
3. WHILE 블로커에 연결된 카드가 하나도 없는 상태에서, THE Auto_Resolve_Service SHALL 자동 해결을 수행하지 않는다.
4. WHEN 블로커가 자동 해결되면, THE Auto_Resolve_Service SHALL 해당 보드 구독자에게 블로커 업데이트 WebSocket 이벤트를 브로드캐스트한다.

### Requirement 5: 블로커 UI에 카드 검색 및 연결 기능 통합

**User Story:** As a 보드 편집자, I want 블로커 섹션에서 직접 카드를 검색하고 연결할 수 있길, so that 별도의 UI 없이 블로커와 관련 카드를 한 곳에서 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 편집 권한이 있는 사용자가 블로커 아이템의 카드 연결 버튼을 클릭하면, THE Blocker_UI SHALL 현재 보드의 카드를 검색할 수 있는 드롭다운을 표시한다.
2. THE Card_Search_Dropdown SHALL 이미 해당 블로커에 연결된 카드와 블로커가 속한 카드 자체를 검색 결과에서 제외한다.
3. WHEN 사용자가 드롭다운에서 카드를 선택하면, THE Blocker_UI SHALL 카드 연결 API를 호출하고 연결된 카드를 블로커 아이템 아래에 표시한다.
4. THE Blocker_UI SHALL 연결된 각 카드의 이름과 완료 상태를 표시한다.
5. WHEN 편집 권한이 있는 사용자가 연결된 카드의 제거 버튼을 클릭하면, THE Blocker_UI SHALL 카드 연결 해제 API를 호출하고 해당 카드를 목록에서 제거한다.
6. WHEN 사용자가 연결된 카드의 이름을 클릭하면, THE Blocker_UI SHALL 해당 카드의 상세 모달로 이동한다.

### Requirement 6: Create Linked Card 기능 제거

**User Story:** As a 개발자, I want 기존 단일 연결 카드 생성 기능을 제거하길, so that 새로운 다중 카드 연결 구조와 충돌하지 않는다.

#### Acceptance Criteria

1. THE Blocker_System SHALL create-linked-card 서버 컨트롤러와 관련 헬퍼를 제거한다.
2. THE Blocker_System SHALL create-linked-card API 라우트를 제거한다.
3. THE Blocker_UI SHALL "Create Linked Card" 버튼과 관련 이벤트 핸들러를 제거한다.
4. THE Blocker_UI SHALL 관련 Redux 액션, 사가, 엔트리 액션을 제거한다.

### Requirement 7: SubTicketSection 컴포넌트 제거

**User Story:** As a 개발자, I want SubTicketSection 컴포넌트를 완전히 제거하길, so that 카드 연결 기능이 블로커 섹션으로 통합되어 중복 UI가 없어진다.

#### Acceptance Criteria

1. THE Blocker_UI SHALL SubTicketSection 컴포넌트 디렉토리(SubTicketSection.jsx, SubTicketSection.module.scss)를 삭제한다.
2. THE Blocker_UI SHALL SubTicketSection을 참조하는 모든 import와 렌더링 코드를 제거한다.
3. THE Blocker_UI SHALL SubTicketSection 관련 셀렉터(makeSelectChildRelationshipsByCardId, makeSelectSubTicketProgress, makeSelectParentRelationshipByCardId)를 제거한다.
4. THE Blocker_System SHALL card_relationship 테이블의 sub_ticket 타입 데이터는 데이터베이스 레벨에서 유지한다.
