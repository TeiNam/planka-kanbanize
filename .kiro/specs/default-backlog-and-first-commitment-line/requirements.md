# Requirements Document: 기본 Backlog 리스트 및 First Commitment 라인

## Introduction

Planka에서 새 보드를 생성할 때, 팀이 즉시 칸반 흐름을 시작할 수 있도록 기본 "Backlog" 리스트와 그 오른쪽에 "First Commitment" 경계선(빨간색)을 자동으로 함께 생성한다. Backlog는 아직 약속(Commit)되지 않은 아이디어/요청이 모이는 공간이고, First Commitment 라인은 팀이 작업을 정식으로 실행하기로 약속하는 시점을 시각적으로 구분한다. Backlog를 포함한 First Commitment 왼쪽(Pre_Commitment_Zone)의 List는 WIP Limit 계산에서 제외되어, 아직 실행에 착수하지 않은 후보 아이템이 자유롭게 쌓일 수 있도록 한다. 이를 통해 신규 사용자도 별도 설정 없이 2-Phase Commit 구조의 출발점을 바로 사용할 수 있다.

본 기능은 신규 보드 생성 경로에만 적용되며, 기존 보드의 리스트 구성과 Commitment Point 데이터에는 영향을 주지 않는다.

## Glossary

- **Board**: 칸반 보드. 프로젝트에 속하는 워크플로우 컨테이너로, 여러 List와 Commitment_Point를 포함한다
- **Project**: 하나 이상의 Board를 포함하는 최상위 컨테이너
- **List**: 보드 내 컬럼(목록). 워크플로우의 한 단계를 나타낸다
- **Backlog_List**: 새 보드 생성 시 자동으로 추가되는 기본 List. 이름 "Backlog", type `active`, 보드의 가장 왼쪽(첫 번째 position)에 위치한다
- **Commitment_Point**: 두 인접한 List 사이에 배치되는 경계선 레코드. `commitment_point` 테이블의 한 행으로, `left_list_id`와 `right_list_id`의 경계에 표시된다
- **First_Commitment_Point**: 새 보드 생성 시 Backlog_List 바로 오른쪽에 자동 생성되는 Commitment_Point. 라벨 "First Commitment", type `commitment`
- **Board_Creator**: Board 생성을 수행하는 사용자(보드 생성 권한을 가진 프로젝트 관리자 또는 사용자)
- **Default_Commitment_Color**: First_Commitment_Point 경계선을 렌더링할 때 사용되는 빨간색 계열 색상 값(구체 색상 코드는 설계 단계에서 확정)
- **Pre_Commitment_Zone**: First_Commitment_Point의 왼쪽에 위치한 모든 List 영역. Backlog_List는 항상 이 영역에 속한다
- **Post_Commitment_Zone**: First_Commitment_Point의 오른쪽(포함)에 위치한 모든 List 영역. 팀이 실행하기로 약속한 작업이 위치한다
- **WIP_Limit**: List 또는 Swim_Lane에 설정된 최대 진행 중 카드 수 제한. `list.wip_limit`, `swim_lane.wip_limit` 컬럼으로 저장되며, 초과 시 경고 또는 이동 차단 정책이 적용된다
- **Board_Admin**: 해당 Board의 WIP_Limit 설정을 변경할 권한을 가진 사용자. 다음 중 하나에 해당하는 사용자. (a) `user_account.role` 값이 `admin`인 시스템 관리자, (b) 해당 Board가 속한 Project의 `project_manager`에 등록된 사용자
- **WIP_Limit_Display_List**: WIP_Limit 값이 List 제목 하단에 표시되는 대상 List. `list.type` 값이 `active`이고, Post_Commitment_Zone에 속하는 List만 해당한다
- **Total_Board_WIP_Limit**: Board 상단에 표시되는 WIP_Limit 합계. 해당 Board의 WIP_Limit_Display_List 중 `wip_limit` 값이 NULL이 아닌 List들의 `wip_limit` 합으로 계산한다

## Requirements

### Requirement 1: 신규 보드 생성 시 기본 Backlog 리스트 자동 생성

**User Story:** Board_Creator로서, 새 보드를 만들 때 Backlog 리스트가 이미 준비되어 있기를 원한다. 이를 통해 빈 보드에서 수동으로 리스트를 만들지 않고도 아이디어를 바로 쌓기 시작할 수 있다.

#### Acceptance Criteria

1. WHEN Board_Creator가 새 Board 생성을 요청하면, THE Board SHALL 이름 "Backlog", type `active`인 Backlog_List를 동일 트랜잭션 내에서 함께 생성한다
2. THE Board SHALL 생성된 Backlog_List의 position을 해당 Board 내 List들 중 가장 작은 값으로 설정하여, Backlog_List가 보드의 최좌측 컬럼이 되도록 한다
3. WHEN Board 생성이 성공하면, THE Board SHALL `boardCreate` WebSocket 이벤트의 `included.lists` 목록에 Backlog_List를 포함하여 구독 중인 사용자에게 브로드캐스트한다
4. IF Board 생성 트랜잭션 중 Backlog_List 생성이 실패하면, THEN THE Board SHALL Board 생성을 롤백하고 Board와 Backlog_List 중 어느 것도 영속되지 않도록 한다
5. WHERE Board 생성 요청이 외부 소스(Trello, Asana, Jira 등) 가져오기(import) 경로를 사용하는 경우, THE Board SHALL 기본 Backlog_List 자동 생성을 수행하지 않고 가져온 리스트 구성을 그대로 유지한다
6. THE Board SHALL 기존에 이미 생성된 Board의 리스트 구성을 본 요구사항 적용 시점 이후에도 변경하지 않는다

### Requirement 2: 신규 보드 생성 시 First Commitment 라인 자동 생성

**User Story:** Board_Creator로서, 새 보드가 만들어질 때 Backlog와 실행 영역을 구분하는 First Commitment 라인이 자동으로 배치되어 있기를 원한다. 이를 통해 팀이 "약속된 작업"과 "아이디어 풀"을 첫 순간부터 명확히 구분할 수 있다.

#### Acceptance Criteria

1. WHEN Board_Creator가 새 Board 생성을 요청하면, THE Board SHALL Backlog_List와 동일 트랜잭션 내에서 하나의 First_Commitment_Point 레코드를 생성한다
2. THE Board SHALL First_Commitment_Point의 `left_list_id`를 Backlog_List의 id로, `right_list_id`를 Backlog_List 다음 위치의 List id로 설정한다
3. THE Board SHALL First_Commitment_Point의 type을 `commitment`, label을 `First Commitment`로 설정한다
4. WHEN First_Commitment_Point가 생성되면, THE Board SHALL `commitmentPointCreate` WebSocket 이벤트를 해당 Board 구독자에게 브로드캐스트한다
5. IF First_Commitment_Point 생성이 실패하면, THEN THE Board SHALL 동일 트랜잭션에서 생성된 Backlog_List 및 Board의 생성을 롤백한다
6. WHERE Board 생성 요청이 외부 소스(Trello, Asana, Jira 등) 가져오기(import) 경로를 사용하는 경우, THE Board SHALL First_Commitment_Point 자동 생성을 수행하지 않는다
7. WHEN 사용자가 자동 생성된 First_Commitment_Point를 삭제하면, THE Board SHALL 해당 삭제를 허용하고 이후 Board에 First_Commitment_Point가 없는 상태를 유지한다
8. THE Board SHALL Backlog_List가 유효하게 존재하는 상태에서도 사용자의 직접적인 First_Commitment_Point 삭제 요청을 허용하며, First_Commitment_Point를 별도의 "삭제 불가" 상태로 보호하지 않는다

### Requirement 3: First Commitment 라인 시각 표시

**User Story:** 팀원으로서, Backlog 리스트와 그 오른쪽 리스트 사이에 눈에 띄는 빨간색 세로 라인을 보고 싶다. 이를 통해 어느 작업이 약속된 작업이고 어느 것이 후보 작업인지 한눈에 알 수 있다.

#### Acceptance Criteria

1. WHEN Board가 렌더링되고 First_Commitment_Point가 존재하면, THE Board SHALL First_Commitment_Point의 `left_list_id`에 해당하는 List와 `right_list_id`에 해당하는 List 사이의 경계에 세로 구분선을 표시한다
2. THE Board SHALL First_Commitment_Point 구분선을 Default_Commitment_Color(빨간색 계열)로 렌더링한다
3. THE Board SHALL First_Commitment_Point 구분선 두께를 2px 이상 4px 이하의 실선으로 렌더링하여 일반 리스트 경계(간격) 및 다른 type의 Commitment_Point 구분선과 시각적으로 구별되도록 한다
4. WHERE First_Commitment_Point의 `left_list_id` 또는 `right_list_id`에 해당하는 List 중 어느 하나라도 현재 뷰포트에 보이지 않는 경우, THE Board SHALL First_Commitment_Point 구분선을 렌더링하지 않는다
5. WHEN 사용자가 수평 스크롤로 Board를 이동하면, THE Board SHALL First_Commitment_Point 구분선을 리스트 사이 경계에 고정된 위치로 함께 이동시킨다
6. THE Board SHALL First_Commitment_Point 구분선 위에 마우스를 올리면 label 값("First Commitment")을 툴팁으로 표시한다

### Requirement 4: First Commitment 라인과 데이터 모델 일관성

**User Story:** 시스템 관리자로서, 자동 생성된 First Commitment 라인이 기존 Commitment Point 기능과 동일한 데이터 모델을 사용하기를 원한다. 이를 통해 별도 분기 로직 없이 기존 편집·삭제·이력 기능을 그대로 재사용할 수 있다.

#### Acceptance Criteria

1. THE Board SHALL First_Commitment_Point를 `commitment_point` 테이블의 한 행으로 저장하며, `board_id`, `left_list_id`, `right_list_id`, `position`, `label`, `type` 컬럼 제약을 모두 만족시킨다
2. THE Board SHALL First_Commitment_Point의 `position` 값을 해당 Board의 Commitment_Point 중 가장 작은 값으로 설정하여, 복수의 Commitment_Point가 존재할 때 First_Commitment_Point가 가장 왼쪽에 위치하도록 한다
3. WHEN 사용자가 First_Commitment_Point의 label을 편집하면, THE Board SHALL 최대 50자까지의 라벨 변경을 허용하고 기존 Commitment_Point 편집 경로와 동일하게 처리한다
4. WHEN 사용자가 First_Commitment_Point를 삭제하면, THE Board SHALL 기존 Commitment_Point 삭제 경로를 통해 해당 레코드를 제거하고, 연관된 `card_commitment_log` 기록은 유지한다
5. IF Board가 이미 보드당 최대 개수의 Commitment_Point를 보유 중인 상태에서 신규 Board 자동 생성이 수행되면, THEN THE Board SHALL 본 요구사항을 적용할 수 없으므로 이 조건은 신규 Board 생성 시 발생하지 않음을 보장한다(신규 Board는 Commitment_Point 개수가 0에서 시작)
6. THE Board SHALL First_Commitment_Point의 `left_list_id`, `right_list_id`가 동일 Board에 속하고 서로 다른 List를 참조하도록 생성 시점에 검증한다

### Requirement 5: 카드 이동 이력과의 연동

**User Story:** 팀 리더로서, 카드가 Backlog에서 오른쪽 리스트로 이동할 때 First Commitment 통과 시점이 자동으로 기록되기를 원한다. 이를 통해 이후 리드타임 분석에서 "약속 시점"을 기준으로 계산할 수 있다.

#### Acceptance Criteria

1. WHEN Card가 Backlog_List에서 First_Commitment_Point의 `right_list_id`에 해당하는 List 또는 그 이후 컬럼으로 이동하면, THE Board SHALL `card_commitment_log` 테이블에 해당 카드 id, First_Commitment_Point id, direction `forward`, 이동 시점을 기록한다
2. WHEN Card가 First_Commitment_Point의 `right_list_id` 또는 그 이후 컬럼에서 Backlog_List로 되돌아가면, THE Board SHALL `card_commitment_log` 테이블에 direction `backward`로 별도 기록한다
3. THE Board SHALL First_Commitment_Point 통과 기록을 기존 Commitment_Point 통과 기록과 동일한 스키마·브로드캐스트 경로로 처리한다
4. IF 기존 스키마 또는 브로드캐스트 경로를 유지할 수 없는 장애 상황이 발생하면, THEN THE Board SHALL `card_commitment_log` 기록은 계속 수행하고, 경로 차이 및 실패 사유를 서버 로그(Winston)에 기록한다

### Requirement 6: 기본 Backlog 리스트 식별 및 보호

**User Story:** 보드 관리자로서, 자동 생성된 Backlog 리스트가 다른 일반 리스트와 동일하게 편집·이름 변경·삭제·이동 가능하기를 원하되, 보드의 초기 상태가 잘못되지 않도록 명확한 규칙이 있기를 원한다.

#### Acceptance Criteria

1. THE Board SHALL 자동 생성된 Backlog_List를 별도의 "삭제 불가" 플래그로 표시하지 않고 일반 List와 동일한 type `active`로 관리한다
2. WHEN 사용자가 Backlog_List의 이름을 변경하면, THE Board SHALL 변경된 이름을 저장하고, 이후에도 First_Commitment_Point는 해당 List의 오른쪽에 그대로 유지한다
3. WHEN 사용자가 Backlog_List의 position을 변경하면, THE Board SHALL 해당 List의 새로운 position을 저장한다
4. IF 사용자가 Backlog_List를 삭제하여 First_Commitment_Point의 `left_list_id`가 더 이상 유효하지 않게 되면, THEN THE Board SHALL First_Commitment_Point 삭제를 우선 시도하고, 삭제가 실패한 경우에 한해 `left_list_id`를 해당 Board의 최좌측 List id로 재설정하는 보조 정책을 적용한다
5. THE Board SHALL 자동 생성 시 Backlog_List와 동일한 이름("Backlog")을 가진 다른 List가 이미 존재하는지 여부와 무관하게 자동 생성을 수행한다(수동 생성으로 동명 리스트를 미리 만들 수 있으므로)

### Requirement 7: 로컬라이제이션 및 표기

**User Story:** 다국어 사용자로서, "Backlog"와 "First Commitment"가 UI 언어에 맞게 표기되기를 원한다.

#### Acceptance Criteria

1. THE Board SHALL Backlog_List의 저장된 name 컬럼 값을 문자열 `Backlog`로 고정 저장하며, 서버 DB에는 번역된 문자열을 저장하지 않는다
2. WHERE 클라이언트가 로컬라이제이션 기능을 제공하는 경우, THE Board SHALL 리스트 이름이 `Backlog`인 자동 생성 List에 한해 UI 표시 시 사용자의 현재 언어 번역 키 `list.defaultBacklogName`을 적용한다
3. THE Board SHALL First_Commitment_Point의 저장된 label 컬럼 값을 문자열 `First Commitment`로 고정 저장한다
4. WHERE 클라이언트가 로컬라이제이션 기능을 제공하는 경우, THE Board SHALL label이 `First Commitment`인 자동 생성 Commitment_Point에 한해 UI 표시 시 번역 키 `commitmentPoint.firstCommitmentLabel`을 적용한다
5. IF 적용 대상 번역 키가 번역 리소스에 존재하지 않거나 번역 로드에 실패하면, THEN THE Board SHALL 해당 번역 키 문자열 자체를 UI에 표시하고 하드코딩된 영문 기본 문자열로 폴백하지 않는다

### Requirement 8: Pre_Commitment_Zone의 WIP Limit 면제

**User Story:** 칸반 팀 리더로서, Backlog를 포함한 First Commitment 왼쪽 영역의 List들은 WIP Limit 계산과 초과 경고 대상에서 제외되기를 원한다. 이를 통해 팀이 아직 약속하지 않은 후보 아이템을 WIP 제약 없이 쌓을 수 있고, 실제 실행 중인 작업의 흐름만 WIP Limit으로 관리할 수 있다.

#### Acceptance Criteria

1. THE Board SHALL Pre_Commitment_Zone에 속한 List에 대해 해당 List 자체의 `wip_limit` 값을 UI 편집 및 저장은 허용하되, 카드 개수가 그 값을 초과해도 초과 경고 또는 이동 차단 정책을 적용하지 않는다
2. THE Board SHALL Board 단위 WIP Limit 합계 또는 누적 카드 수 계산 시 Pre_Commitment_Zone에 속한 List의 카드를 포함하지 않는다
3. THE Board SHALL Swim_Lane의 `wip_limit`을 검사할 때 Pre_Commitment_Zone에 속한 List에 위치한 카드를 Swim_Lane 누적 카드 수에서 제외한다
4. WHERE First_Commitment_Point가 존재하지 않는 Board의 경우, THE Board SHALL 모든 List를 Post_Commitment_Zone으로 간주하여 기존 WIP Limit 정책을 전 List에 동일하게 적용한다
5. WHERE Board에 복수의 Commitment_Point가 존재하는 경우, THE Board SHALL `position` 값이 가장 작은 Commitment_Point를 First_Commitment_Point로 식별하여 Pre_Commitment_Zone과 Post_Commitment_Zone의 경계로 사용한다
6. WHEN Card가 Pre_Commitment_Zone의 List에서 Post_Commitment_Zone의 List로 이동하면, THE Board SHALL 이동 직후의 대상 List 및 Swim_Lane의 WIP Limit 초과 여부를 재계산하여 초과 시 기존 정책(경고 또는 이동 차단)을 적용한다
7. WHEN Card가 Post_Commitment_Zone의 List에서 Pre_Commitment_Zone의 List로 되돌아가면, THE Board SHALL 원래 출발지였던 Post_Commitment_Zone List의 WIP Limit 초과 상태를 해제하여 UI 경고 표시를 즉시 업데이트한다
8. THE Board SHALL Pre_Commitment_Zone List의 UI에서 카드 수를 표시할 때 WIP Limit 초과 색상(일반적으로 적색/주의) 스타일을 적용하지 않는다

### Requirement 9: WIP Limit UI 표시 및 관리자 전용 편집

**User Story:** 팀원으로서, 실행 중인 컬럼의 WIP Limit과 보드 전체 총합을 UI에서 한눈에 확인하고 싶고, 팀 리더/관리자만 값을 변경할 수 있기를 원한다. 이를 통해 팀의 동시 작업 수 제약을 투명하게 관리하고, 의도치 않은 변경을 방지할 수 있다.

#### Acceptance Criteria

1. WHEN Board가 렌더링되면, THE Board SHALL 각 WIP_Limit_Display_List의 제목 바로 아래에 해당 List의 `wip_limit` 값을 `WIP: {value}` 형식의 문자열로 표시한다
2. WHERE WIP_Limit_Display_List의 `wip_limit` 값이 NULL인 경우, THE Board SHALL 해당 표시 위치에 `WIP: ∞` 문자열을 표시한다
3. THE Board SHALL Pre_Commitment_Zone에 속한 List 및 `list.type` 값이 `closed`인 List에 대해서는 List 제목 하단 및 Board 상단의 WIP_Limit 관련 표시를 렌더링하지 않는다
4. WHEN Board가 렌더링되면, THE Board SHALL Board 상단 영역에 `Total WIP: {sum}` 형식의 문자열로 Total_Board_WIP_Limit 값을 표시한다
5. WHERE Total_Board_WIP_Limit을 구성하는 WIP_Limit_Display_List 중 `wip_limit` 값이 NULL인 List가 하나 이상 존재하는 경우, THE Board SHALL Total_Board_WIP_Limit 표시 문자열에 `∞` 기호를 포함하여 제한 없음 상태를 나타낸다
6. WHERE Board에 WIP_Limit_Display_List가 한 개도 존재하지 않는 경우, THE Board SHALL Total_Board_WIP_Limit 표시를 렌더링하지 않는다
7. WHEN 현재 사용자가 Board_Admin이 아니면, THE Board SHALL List 제목 하단 및 Board 상단의 WIP_Limit 표시를 읽기 전용으로 제공하고 해당 영역에서 편집 UI(입력 필드, 편집 아이콘 등)를 표시하지 않는다
8. WHEN 현재 사용자가 Board_Admin이면, THE Board SHALL List 제목 하단 WIP_Limit 표시 영역 위에 마우스 커서가 올라갈 때 편집 아이콘을 표시하고, 클릭 시 해당 List의 `wip_limit` 값을 숫자 입력 필드로 편집할 수 있도록 한다
9. IF Board_Admin이 아닌 사용자가 List의 `wip_limit`을 변경하는 API 요청(`PATCH /api/lists/:id`에서 `wipLimit` 필드 포함)을 직접 전송하면, THEN THE Board SHALL 해당 요청을 `403 Forbidden` 응답으로 거부하고 `wip_limit` 값을 변경하지 않는다
10. WHEN Board_Admin이 List의 `wip_limit`을 변경하여 저장하면, THE Board SHALL 변경된 값을 `list.wip_limit` 컬럼에 저장하고, `listUpdate` WebSocket 이벤트로 구독자에게 브로드캐스트하며, 브로드캐스트를 받은 클라이언트는 Total_Board_WIP_Limit 표시를 재계산하여 갱신한다
11. THE Board SHALL `wip_limit` 편집 입력 필드에 대해 0 이상의 정수만 허용하고, 빈 문자열 입력은 NULL로 저장하며, 음수 또는 소수 입력은 저장 전 클라이언트 검증으로 차단한다
12. THE Board SHALL List의 카드 수가 해당 List의 `wip_limit`을 초과하는 경우, List 제목 하단 WIP_Limit 표시를 기존 WIP 초과 스타일(일반적으로 적색 계열 배경 또는 텍스트)로 강조하되, 이 강조는 Post_Commitment_Zone 및 `list.type` 값이 `active`인 List에서만 적용한다
