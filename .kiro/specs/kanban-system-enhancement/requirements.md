# 요구사항 문서: 칸반 시스템 고도화 (Kanban System Enhancement)

## 소개

Planka 프로젝트를 단순 태스크 매니저에서 진정한 칸반 시스템으로 고도화한다. LEAN 사상과 칸반 6가지 일반 실천법(Visualize, Limit WIP, Manage Flow, Make Policies Explicit, Implement Feedback Loops, Improve Collaboratively)을 기반으로, WIP 제한, 스윔레인, 서비스 클래스, Commitment Point, Pull 시스템, 칸반 메트릭 분석 등 핵심 칸반 기능을 구현한다.

## 용어 정의 (Glossary)

- **Board**: 칸반 보드. 프로젝트의 워크플로우를 시각화하는 최상위 컨테이너
- **List**: 보드 내 컬럼. 워크플로우의 각 단계를 나타냄
- **Card**: 칸반 카드(티켓). 하나의 작업 항목을 나타냄
- **Swim_Lane**: 스윔레인. 보드의 가로 줄 구분으로 작업 유형, 서비스 클래스, 요청자별, 프로젝트별로 구역을 격리
- **WIP_Limit**: Work In Progress 제한. 동시에 진행 가능한 최대 작업 수
- **System_Level_WIP**: 전체 보드의 WIP 합계. Total WIP
- **Class_of_Service**: 서비스 클래스(CoS). 지연 비용(Cost of Delay) 성격에 따른 작업 분류 체계
- **Commitment_Point**: 약속 지점. 작업 실행을 공식 약속하는 시점의 시각적 구분선
- **Delivery_Point**: 인도 지점. 작업이 고객에게 전달 완료되는 시점
- **Sub_Column**: 서브컬럼. 하나의 컬럼 내 Active/Done 구분
- **Buffer_Column**: 버퍼 컬럼. 단계 간 대기열 역할을 하는 컬럼 (예: Dev Ready, Test Ready)
- **Pull_Criteria**: 풀 기준. 다음 단계로 작업을 당겨오기 위한 최소 품질 요건
- **Policy**: 정책. 각 컬럼에 명시적으로 표시되는 운영 규칙
- **CFD**: Cumulative Flow Diagram. 시간별 누적 흐름도
- **Lead_Time**: 요청 접수부터 완료까지의 총 시간
- **Throughput**: 단위 시간당 완료된 작업 항목 수 (Delivery Rate)
- **Ticket_Age**: 티켓 나이. 작업이 시스템에 머문 시간
- **Blocker**: 블로커. 작업 흐름을 막는 장애 요소
- **Decorator**: 데코레이터. 카드에 표시되는 기술 의존성 등의 아이콘 표시
- **SLA_Bar**: SLA 진행 바. 비즈니스 리스크를 시각화하는 진행률 표시
- **Kanban_Metrics_Dashboard**: 칸반 메트릭 대시보드. CFD, 리드타임 분포, Run Chart, WIP Aging Chart를 포함하는 분석 화면
- **Little_Law**: 리틀의 법칙. Lead Time = WIP / Throughput

## 요구사항

### Requirement 1: 스윔레인 (Swim Lanes)

**User Story:** 보드 관리자로서, 보드에 스윔레인을 추가하여 작업 유형, 서비스 클래스, 요청자별, 프로젝트별로 작업을 시각적으로 격리하고 싶다. 이를 통해 각 카테고리별 가용성(Capacity)을 독립적으로 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 보드 관리자가 스윔레인 추가를 요청하면, THE Board SHALL 1자 이상 50자 이하의 이름을 입력받아 새로운 Swim_Lane을 생성하고 보드에 가로 줄로 표시한다
2. THE Board SHALL Swim_Lane을 Work Item Type, Class_of_Service, 요청자, 프로젝트 기준으로 분류할 수 있는 카테고리 속성을 제공한다
3. WHEN Swim_Lane이 생성되면, THE Board SHALL 해당 Swim_Lane에 독립적인 WIP_Limit을 1 이상 100 이하의 정수로 설정할 수 있는 기능을 제공하며, WIP_Limit 미설정 시 제한 없음(무제한)으로 동작한다
4. THE Board SHALL 각 Swim_Lane의 현재 WIP 수와 WIP_Limit을 Swim_Lane 헤더에 "현재WIP / WIP_Limit" 형식으로 표시한다
5. WHEN Swim_Lane의 WIP가 WIP_Limit을 초과하면, THE Board SHALL 해당 Swim_Lane 헤더를 빨간색으로 강조 표시한다
6. THE Board SHALL Swim_Lane의 순서를 드래그 앤 드롭으로 변경할 수 있는 기능을 제공한다
7. WHEN Expedite 유형의 Swim_Lane이 생성되면, THE Board SHALL 해당 Swim_Lane을 보드 최상단에 고정 배치하고 WIP_Limit 기본값을 1로 설정하며, 드래그 앤 드롭에 의한 순서 변경 대상에서 제외한다
8. IF 보드 관리자가 카드가 존재하는 Swim_Lane을 삭제하려고 하면, THEN THE Board SHALL 삭제를 차단하고 해당 Swim_Lane 내 카드를 다른 Swim_Lane으로 이동하거나 삭제한 후 재시도하도록 안내 메시지를 표시한다

### Requirement 2: WIP 제한 (WIP Limit)

**User Story:** 보드 관리자로서, 컬럼별 및 시스템 레벨의 WIP 제한을 설정하여 과부하를 방지하고 Pull 시스템을 구현하고 싶다. 이를 통해 리드타임을 예측 가능하게 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 보드 관리자가 컬럼의 WIP_Limit을 1 이상 100 이하의 정수로 설정하면, THE List SHALL 해당 제한값을 컬럼 헤더에 현재 카드 수와 함께 "현재수/제한값" 형식으로 표시한다 (예: "3/5")
2. WHEN 컬럼의 카드 수가 WIP_Limit을 초과하면, THE List SHALL 컬럼 헤더 배경색을 빨간색으로 변경하여 시각적 경고를 표시한다
3. THE Board SHALL System_Level_WIP를 보드 상단에 Commitment Point 이후부터 Delivery Point 이전까지의 모든 컬럼에 속한 카드 수의 합과 총 WIP_Limit으로 표시한다 (예: "Total WIP: 18/24")
4. WHEN System_Level_WIP가 설정된 제한을 초과하면, THE Board SHALL 보드 상단의 System_Level_WIP 표시를 빨간색으로 강조한다
5. WHEN 컬럼에 WIP_Limit이 설정되고 현재 카드 수가 제한 미만이면, THE List SHALL 남은 슬롯 수를 빈 영역으로 표시하여 새 작업을 당겨올 수 있음을 나타낸다
6. IF 카드 이동으로 인해 대상 컬럼의 카드 수가 WIP_Limit을 초과하게 되면, THEN THE Board SHALL 이동을 차단하지 않되, 이동 직전에 WIP 초과를 알리는 확인 대화상자를 표시한다 (소프트 제한)
7. WHEN 보드 관리자가 컬럼의 WIP_Limit 값을 0으로 설정하거나 삭제하면, THE List SHALL 해당 컬럼의 WIP 제한을 해제하고 카드 수 및 빈 슬롯 표시를 제거한다

### Requirement 3: Commitment Point (약속 지점)

**User Story:** 보드 관리자로서, 보드에 Commitment Point를 시각적으로 표시하여 팀이 작업의 약속 시점을 명확히 인식할 수 있게 하고 싶다. 이를 통해 2-Phase Commit 구조를 구현할 수 있다.

#### Acceptance Criteria

1. THE Board SHALL 보드 관리자에게 인접한 두 컬럼 사이에 Commitment_Point 구분선을 배치할 수 있는 기능을 제공한다
2. WHEN Commitment_Point가 설정되면, THE Board SHALL 해당 위치에 일반 컬럼 경계와 시각적으로 구별되는 구분선(점선 등)을 표시한다
3. THE Board SHALL 보드당 최소 2개, 최대 5개의 Commitment_Point를 지원한다 (1st: 아이디어→Dev Ready 진입, 2nd: UAT 완료→배포 직전)
4. WHEN Card가 Commitment_Point 이전 컬럼에서 이후 컬럼으로 이동하면, THE Card SHALL 해당 Commitment_Point의 통과 시점을 타임스탬프(초 단위)로 자동 기록한다
5. THE Board SHALL 각 Commitment_Point에 최대 50자의 라벨(이름)을 설정할 수 있는 기능을 제공한다
6. IF Commitment_Point가 삭제되면, THEN THE Board SHALL 해당 Commitment_Point를 통과한 Card들의 기존 타임스탬프 기록을 보존한다
7. WHEN Card가 Commitment_Point 이후 컬럼에서 이전 컬럼으로 되돌아가면, THE Card SHALL 해당 역방향 이동 시점을 별도의 타임스탬프로 기록한다

### Requirement 4: 칸반 카드 정보 강화

**User Story:** 팀원으로서, 카드를 클릭하지 않고도 보드 위에서 작업의 핵심 정보를 한눈에 파악하고 싶다. 이를 통해 Pull 결정에 필요한 정보를 즉시 확인할 수 있다.

#### Acceptance Criteria

1. THE Card SHALL 보드 뷰에서 고유 ID 또는 Tracking Number를 카드 상단에 표시한다
2. THE Card SHALL 제목과 함께 설명의 처음 2줄(줄바꿈 문자 기준)을 미리보기로 표시하며, 2줄을 초과하는 내용은 말줄임표(...)로 생략한다
3. THE Card SHALL Class_of_Service 또는 Work Item Type에 따라 카드 좌측 또는 상단에 색상 띠를 표시한다
4. IF Card에 Start 날짜, End 날짜, 또는 Due 날짜가 설정되어 있으면, THEN THE Card SHALL 해당 날짜를 아이콘과 함께 카드 하단에 표시하고, 설정되지 않은 날짜 항목은 표시하지 않는다
5. WHEN Card에 Due 날짜가 설정되면, THE Card SHALL Start 날짜(Start 날짜 미설정 시 카드 생성일)부터 Due 날짜까지의 전체 기간 대비 현재까지 경과 시간의 비율을 SLA 진행 바로 시각화하며, 기본 색상은 녹색으로 표시한다
6. WHEN SLA_Bar의 경과 비율이 80%를 초과하면, THE Card SHALL SLA_Bar 색상을 주황색으로 변경한다
7. WHEN SLA_Bar의 경과 비율이 100%를 초과하면, THE Card SHALL SLA_Bar 색상을 빨간색으로 변경한다
8. THE Card SHALL 기술 의존성을 나타내는 Decorator 아이콘(별, 원 등)을 최대 5개까지 카드에 표시할 수 있는 기능을 제공한다
9. THE Card SHALL 우선순위 레벨을 문자로 표시할 수 있는 기능을 제공한다 (예: "H", "M", "L")
10. THE Card SHALL Ticket_Age를 Commitment Point 진입일(Commitment Point 미설정 시 카드 생성일)로부터 현재까지의 경과 일수를 일(day) 단위 정수로 카드에 표시한다
11. WHEN Card에 Blocker가 등록되면, THE Card SHALL 빨간색 블로커 아이콘과 블로커 사유 텍스트를 최대 30자까지 카드에 표시하며, 초과 시 말줄임표(...)로 생략한다
12. THE Card SHALL 담당자 아바타를 카드 우측 하단에 표시한다

### Requirement 5: 서비스 클래스 (Classes of Service)

**User Story:** 보드 관리자로서, 서비스 클래스를 정의하고 각 클래스별 정책과 시각적 구분을 설정하여 지연 비용에 따른 차별화된 처리를 구현하고 싶다.

#### Acceptance Criteria

1. THE Board SHALL Expedite, Fixed_Date, Standard, Intangible 4가지 기본 Class_of_Service를 제공한다
2. THE Board SHALL 각 Class_of_Service에 시스템이 제공하는 색상 팔레트에서 고유 색상을 할당할 수 있는 기능을 제공한다
3. WHEN Card에 Class_of_Service가 할당되면, THE Card SHALL 해당 클래스의 색상을 카드 좌측 4px 너비의 세로 띠로 표시한다
4. WHILE Card의 Class_of_Service가 Expedite인 동안, THE Board SHALL 해당 카드를 동일 Swim_Lane 내에서 최상단에 배치하며, 복수의 Expedite 카드가 존재할 경우 Expedite 할당 시각이 빠른 순서로 정렬한다
5. WHILE Card의 Class_of_Service가 Fixed_Date인 동안, THE Card SHALL Due 날짜를 볼드체 및 색상 강조로 표시하고 남은 일수를 정수 카운트다운으로 표시한다
6. IF Card의 Class_of_Service가 Fixed_Date로 설정될 때 Due 날짜가 지정되지 않은 경우, THEN THE Board SHALL Due 날짜 입력을 필수로 요구하고 입력 완료 전까지 할당을 완료하지 않는다
7. THE Board SHALL 사용자 정의 Class_of_Service를 최대 10개까지 추가할 수 있는 기능을 제공하며, 생성 시 이름(최대 30자)과 색상을 필수 입력으로 요구한다
8. THE Board SHALL 각 Class_of_Service에 처리 정책 텍스트를 최대 500자까지 설정할 수 있는 기능을 제공한다

### Requirement 6: 칸반 메트릭 분석 대시보드

**User Story:** 팀 리더로서, 칸반 핵심 메트릭을 차트로 분석하여 시스템의 흐름 상태를 파악하고 데이터 기반 개선 결정을 내리고 싶다.

#### Acceptance Criteria

1. THE Kanban_Metrics_Dashboard SHALL CFD(Cumulative Flow Diagram)를 일 단위 시간축 기반으로 표시하여 각 컬럼별 누적 카드 수의 변화를 시각화한다
2. THE Kanban_Metrics_Dashboard SHALL CFD에서 각 컬럼 상태를 색상이 구분된 밴드로 표시하여, 밴드 두께로 WIP 수준을, 밴드 간 수평 거리로 대략적인 Lead_Time을, 최상위 밴드의 기울기로 Throughput을 파악할 수 있도록 한다
3. THE Kanban_Metrics_Dashboard SHALL Lead Time Distribution을 히스토그램으로 표시하여 리드타임 분포를 시각화하되, Lead_Time은 카드가 Commitment_Point에 진입한 시점부터 Delivery_Point를 통과한 시점까지의 경과 일수로 계산한다
4. THE Kanban_Metrics_Dashboard SHALL Lead Time Distribution 히스토그램에 85th percentile 기준선을 수직선으로 표시하고 해당 값을 라벨로 표기한다
5. THE Kanban_Metrics_Dashboard SHALL Run Chart를 표시하여 완료된 각 카드의 Lead_Time을 시간순으로 점으로 표시하고, Throughput 추이를 주 단위 완료 건수로 시각화한다
6. THE Kanban_Metrics_Dashboard SHALL WIP Aging Chart를 표시하여 현재 진행 중인 각 카드의 Ticket_Age(해당 컬럼 진입 후 경과 일수)를 컬럼별로 시각화한다
7. THE Kanban_Metrics_Dashboard SHALL Little_Law 기반 지표를 요약 패널에 표시하되, 현재 필터 기간 내 평균 WIP를 동일 기간의 일 평균 Delivery_Rate(완료 건수/일)로 나누어 예상 Lead_Time(일)을 계산한다
8. THE Kanban_Metrics_Dashboard SHALL 날짜 범위 필터를 제공하되, 기본값은 최근 30일로 설정하고, 최소 1일부터 최대 365일까지의 기간을 선택할 수 있도록 한다
9. THE Kanban_Metrics_Dashboard SHALL Class_of_Service별 필터를 제공하여 특정 서비스 클래스의 메트릭만 조회할 수 있는 기능을 제공한다
10. IF 선택된 분석 기간 내 완료된 카드가 존재하지 않는 경우, THEN THE Kanban_Metrics_Dashboard SHALL 각 차트 영역에 데이터 부족 안내 메시지를 표시하고 빈 차트 상태를 유지한다

### Requirement 7: 컬럼 구조 고도화

**User Story:** 보드 관리자로서, 컬럼에 Active/Done 서브컬럼, 버퍼 컬럼, Pull Criteria, 정책 표시 기능을 추가하여 워크플로우를 정밀하게 모델링하고 싶다.

#### Acceptance Criteria

1. WHEN 보드 관리자가 컬럼에 서브컬럼 설정을 활성화하면, THE List SHALL 해당 컬럼을 Active와 Done 두 개의 Sub_Column으로 분할하여 표시하고, 기존 카드는 Active Sub_Column에 배치한다
2. THE Sub_Column SHALL 각각 독립적인 WIP_Limit(1 이상의 정수)을 설정할 수 있는 기능을 제공하며, 부모 컬럼의 WIP_Limit은 두 Sub_Column의 WIP_Limit 합으로 자동 계산된다
3. WHEN 보드 관리자가 컬럼 설정에서 Buffer_Column 유형을 지정하면, THE Board SHALL 해당 컬럼을 일반 컬럼과 시각적으로 구분하여 표시한다 (점선 테두리 또는 배경색 차이)
4. THE List SHALL 컬럼 상단 또는 하단에 Pull_Criteria 텍스트를 최대 500자까지 입력 및 표시할 수 있는 기능을 제공하며, 컬럼 내에서는 2줄까지 표시하고 초과분은 말줄임 처리한다
5. THE List SHALL 컬럼 하단에 Policy 텍스트를 최대 500자까지 입력 및 표시할 수 있는 기능을 제공하며, 컬럼 내에서는 2줄까지 표시하고 초과분은 말줄임 처리한다
6. WHEN 사용자가 Pull_Criteria 또는 Policy 영역을 클릭하면, THE List SHALL 전체 텍스트를 팝오버로 표시한다
7. WHEN 보드 관리자가 서브컬럼 설정을 비활성화하면, THE List SHALL Done Sub_Column의 카드를 부모 컬럼으로 병합하여 Active Sub_Column 카드 뒤에 배치한다

### Requirement 8: 블로커 관리 및 백로그 연결

**User Story:** 팀원으로서, 카드에 블로킹 이슈를 등록하고 해당 블로커를 해결하기 위한 새로운 카드를 자동 생성하여 백로그에 연결하고 싶다. 이를 통해 블로킹 원인을 추적하고 해결 작업을 체계적으로 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 팀원이 카드에 블로커를 등록하면, THE Card SHALL 블로커 사유 텍스트(최대 200자)와 등록 시점 타임스탬프를 기록하고, 카드에 빨간색 블로커 아이콘을 표시한다
2. WHEN 블로커가 등록된 상태에서 사용자가 "블로커 카드 생성" 버튼을 클릭하면, THE Board SHALL 보드의 첫 번째 컬럼(백로그)에 블로커 사유를 제목으로 하는 새 카드를 자동 생성하고, 원본 카드와 양방향 연결 관계를 설정한다
3. THE Card SHALL 블로커로 인해 생성된 연결 카드의 ID와 제목을 블로커 영역에 링크로 표시하며, 클릭 시 해당 카드로 이동한다
4. WHEN 블로커 연결 카드가 Delivery_Point를 통과하면, THE Board SHALL 원본 카드의 블로커 상태를 자동으로 "해결됨"으로 변경하고 블로커 아이콘 색상을 회색으로 전환한다
5. THE Card SHALL 복수의 블로커를 동시에 등록할 수 있으며, 각 블로커는 독립적인 상태(활성/해결됨)를 가진다
6. THE Card SHALL 블로커 이력(등록 시점, 해결 시점, 블로킹 기간)을 카드 상세 화면에서 조회할 수 있는 기능을 제공한다
7. WHEN 카드에 활성 블로커가 1개 이상 존재하면, THE Card SHALL 보드 뷰에서 블로커 수를 빨간색 배지로 표시한다

### Requirement 9: 하위 티켓 (Sub-tickets)

**User Story:** 팀원으로서, 하나의 카드 아래에 하위 카드를 생성하여 큰 작업을 세분화하고 진행 상황을 상위 카드에서 한눈에 파악하고 싶다. 이를 통해 복잡한 작업의 분해와 추적을 체계적으로 관리할 수 있다.

#### Acceptance Criteria

1. THE Card SHALL 다른 카드를 하위 티켓(Sub-ticket)으로 추가할 수 있는 기능을 제공하며, 하위 티켓은 동일 보드 내의 카드만 지정 가능하다
2. WHEN 하위 티켓이 추가되면, THE Card SHALL 상위 카드의 상세 화면에 하위 티켓 목록을 표시하되, 각 하위 티켓의 제목, 현재 컬럼명, 담당자 아바타, 완료 여부를 포함한다
3. THE Card SHALL 상위 카드의 보드 뷰에서 하위 티켓 진행률을 "완료수/전체수" 형식의 프로그레스 바로 표시한다 (예: "3/5")
4. WHEN 하위 티켓이 Delivery_Point를 통과하면, THE Card SHALL 해당 하위 티켓을 "완료" 상태로 자동 표시하고 상위 카드의 진행률을 갱신한다
5. THE Card SHALL 하위 티켓에서 상위 카드로의 역참조 링크를 표시하여, 하위 티켓 상세 화면에서 "상위 카드: [카드 제목]" 형태로 상위 카드에 접근할 수 있도록 한다
6. IF 상위 카드가 삭제되면, THEN THE Board SHALL 하위 티켓들의 상위 참조를 제거하되 하위 티켓 카드 자체는 삭제하지 않는다
7. THE Card SHALL 최대 20개의 하위 티켓을 가질 수 있으며, 하위 티켓은 다시 하위 티켓을 가질 수 없다 (1단계 깊이 제한)
8. WHEN 사용자가 상위 카드의 하위 티켓 목록에서 "새 하위 티켓 생성" 버튼을 클릭하면, THE Board SHALL 상위 카드와 동일한 컬럼에 새 카드를 생성하고 자동으로 하위 티켓 관계를 설정한다

### Requirement 10: Pull 시스템 시각화

**User Story:** 팀원으로서, 보드에서 Pull 시스템의 동작을 시각적으로 인식하여 언제 새 작업을 당겨와야 하는지 명확히 알고 싶다.

#### Acceptance Criteria

1. WHILE 컬럼의 카드 수가 WIP_Limit 미만인 상태에서, THE List SHALL 빈 슬롯을 점선 카드 형태로 표시하여 새 작업을 당겨올 수 있음을 시각화한다 (빈 슬롯 수 = WIP_Limit - 현재 카드 수)
2. THE Board SHALL Pull 방향을 나타내는 화살표를 컬럼 간에 표시한다 (오른쪽에서 왼쪽 방향)
3. THE List SHALL 컬럼 헤더에 현재 가용 Capacity를 숫자로 표시한다 (WIP_Limit - 현재 카드 수)
4. WHILE 빈 슬롯이 존재하는 컬럼의 이전 컬럼(왼쪽)에 카드가 있는 동안, THE Board SHALL 해당 카드에 Pull 가능 상태임을 나타내는 시각적 강조 표시를 적용한다
5. IF 컬럼에 WIP_Limit이 설정되어 있지 않으면, THEN THE List SHALL 해당 컬럼에 빈 슬롯 표시, 가용 Capacity 숫자, Pull 가능 힌트를 표시하지 않는다
6. WHEN 카드가 컬럼에 추가되거나 제거되면, THE Board SHALL 해당 컬럼 및 인접 컬럼의 Pull 시각화 상태를 1초 이내에 갱신한다
