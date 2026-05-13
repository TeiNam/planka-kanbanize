# 구현 계획: 칸반 시스템 고도화 (Kanban System Enhancement)

## Overview

Planka를 진정한 칸반 시스템으로 고도화하기 위한 구현 계획이다. 10개 핵심 기능을 DB 마이그레이션 → 서버 모델/헬퍼/컨트롤러 → 클라이언트 상태/UI 순서로 점진적으로 구현한다. 기존 Planka의 Sails.js MVC + Redux-Saga + WebSocket 패턴을 그대로 따른다.

## Tasks

- [x] 1. DB 마이그레이션 및 모델 기반 구축
  - [x] 1.1 스윔레인, 서비스 클래스, 데코레이터 테이블 마이그레이션 생성
    - `server/db/migrations/` 에 swim_lane, class_of_service, decorator, card_decorator 테이블 생성 마이그레이션 작성
    - card 테이블에 swim_lane_id, class_of_service_id, priority, start_date, completed_at 컬럼 추가
    - 모든 외래 키 및 인덱스 포함
    - _Requirements: 1.1, 5.1, 4.9, 4.4, 4.8_
  - [x] 1.2 WIP 제한 및 컬럼 구조 마이그레이션 생성
    - list 테이블에 wip_limit, sub_column_type, parent_list_id, is_buffer, pull_criteria, policy 컬럼 추가
    - board 테이블에 system_wip_limit 컬럼 추가
    - 인덱스 생성 포함
    - _Requirements: 2.1, 7.1, 7.3, 7.4, 7.5_
  - [x] 1.3 Commitment Point 및 카드 이동 이력 마이그레이션 생성
    - commitment_point, card_commitment_log, card_movement_log 테이블 생성
    - 복합 인덱스 및 시간 기반 인덱스 포함
    - _Requirements: 3.1, 3.4, 6.3_
  - [x] 1.4 블로커, 카드 관계, 메트릭 스냅샷 마이그레이션 생성
    - blocker, card_relationship, board_daily_snapshot 테이블 생성
    - 유니크 인덱스 및 복합 인덱스 포함
    - _Requirements: 8.1, 9.1, 6.1_
  - [x] 1.5 Waterline 모델 생성
    - SwimLane, CommitmentPoint, CardCommitmentLog, ClassOfService, Decorator, CardDecorator, Blocker, CardRelationship, BoardDailySnapshot, CardMovementLog 모델 파일 생성
    - 기존 Card, List, Board 모델에 새 속성 추가
    - _Requirements: 1.1~10.6 (전체 데이터 모델 기반)_

- [x] 2. 체크포인트 - DB 마이그레이션 검증
  - 마이그레이션 실행 및 롤백 테스트, 문제 발생 시 사용자에게 확인

- [x] 3. 스윔레인 서버 구현
  - [x] 3.1 스윔레인 헬퍼 구현
    - `server/api/helpers/swim-lanes/` 에 create-one.js, update-one.js, delete-one.js 헬퍼 작성
    - 생성 시 position 계산, Expedite 타입 최상단 고정 로직
    - 삭제 시 카드 존재 여부 검증 (카드 있으면 삭제 차단)
    - WebSocket 브로드캐스트 포함
    - _Requirements: 1.1, 1.7, 1.8_
  - [x] 3.2 스윔레인 컨트롤러 구현
    - `server/api/controllers/swim-lanes/` 에 create.js, update.js, delete.js, sort.js 작성
    - 입력 검증: name 1~50자, wipLimit 1~100 정수 또는 null, type enum
    - 보드 멤버십 및 에디터 권한 검증
    - _Requirements: 1.1, 1.2, 1.3, 1.6_
  - [x] 3.3 스윔레인 서버 통합 테스트 작성
    - CRUD API 엔드포인트 테스트 (Mocha + Chai + Supertest)
    - WIP 제한 검증, Expedite 타입 동작, 삭제 차단 시나리오
    - _Requirements: 1.1~1.8_

- [x] 4. WIP 제한 및 컬럼 구조 서버 구현
  - [x] 4.1 기존 List 컨트롤러/헬퍼 확장
    - list update 헬퍼에 wipLimit, subColumnType, parentListId, isBuffer, pullCriteria, policy 필드 처리 추가
    - 서브컬럼 활성화/비활성화 시 카드 재배치 로직 구현
    - _Requirements: 2.1, 2.7, 7.1, 7.2, 7.7_
  - [x] 4.2 기존 Board 컨트롤러/헬퍼 확장
    - board update 헬퍼에 systemWipLimit 필드 처리 추가
    - _Requirements: 2.3_
  - [x] 4.3 카드 이동 시 WIP 초과 검증 헬퍼 구현
    - `server/api/helpers/cards/record-movement.js` 작성
    - 카드 이동 시 card_movement_log 기록
    - 대상 컬럼 WIP 초과 여부 응답에 포함 (소프트 제한)
    - _Requirements: 2.6, 6.3_
  - [x] 4.4 WIP 제한 및 컬럼 구조 서버 통합 테스트
    - WIP 초과 경고 응답, 서브컬럼 생성/병합, 버퍼 컬럼 설정 테스트
    - _Requirements: 2.1~2.7, 7.1~7.7_

- [x] 5. Commitment Point 서버 구현
  - [x] 5.1 Commitment Point 헬퍼/컨트롤러 구현
    - `server/api/helpers/commitment-points/` 및 `server/api/controllers/commitment-points/` 작성
    - 보드당 2~5개 제한 검증
    - 생성 시 left_list_id, right_list_id 유효성 검증
    - WebSocket 브로드캐스트 포함
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  - [x] 5.2 카드 Commitment Point 통과 기록 로직 구현
    - 카드 이동 헬퍼에서 Commitment Point 경계 통과 감지
    - card_commitment_log에 정방향/역방향 통과 기록
    - card.completed_at 자동 기록 (Delivery Point 통과 시)
    - _Requirements: 3.4, 3.7_
  - [x] 5.3 Commitment Point 서버 통합 테스트
    - CRUD, 통과 기록, 역방향 이동 기록 테스트
    - _Requirements: 3.1~3.7_

- [x] 6. 서비스 클래스 및 데코레이터 서버 구현
  - [x] 6.1 서비스 클래스 헬퍼/컨트롤러 구현
    - `server/api/helpers/classes-of-service/` 및 `server/api/controllers/classes-of-service/` 작성
    - 기본 4종(Expedite, Fixed_Date, Standard, Intangible) 초기화 로직
    - 사용자 정의 최대 10개 제한, Fixed_Date 시 Due 날짜 필수 검증
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 5.8_
  - [x] 6.2 데코레이터 헬퍼/컨트롤러 구현
    - `server/api/helpers/decorators/`, `server/api/controllers/decorators/`, `server/api/controllers/card-decorators/` 작성
    - 카드당 데코레이터 최대 5개 제한
    - _Requirements: 4.8_
  - [x] 6.3 카드 업데이트 헬퍼 확장
    - 기존 card update 헬퍼에 classOfServiceId, priority, startDate, swimLaneId 필드 처리 추가
    - Expedite 클래스 할당 시 카드 최상단 배치 로직
    - _Requirements: 5.3, 5.4, 4.9_
  - [x] 6.4 서비스 클래스/데코레이터 서버 통합 테스트
    - _Requirements: 5.1~5.8, 4.8_

- [x] 7. 블로커 및 하위 티켓 서버 구현
  - [x] 7.1 블로커 헬퍼/컨트롤러 구현
    - `server/api/helpers/blockers/` 및 `server/api/controllers/blockers/` 작성
    - 블로커 등록, 상태 변경, 연결 카드 자동 생성 로직
    - 연결 카드 Delivery Point 통과 시 블로커 자동 해결
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 7.2 카드 관계(하위 티켓) 헬퍼/컨트롤러 구현
    - `server/api/helpers/card-relationships/` 및 `server/api/controllers/card-relationships/` 작성
    - 상위 카드당 하위 티켓 20개 제한, 1단계 깊이 제한 검증
    - 상위 카드 삭제 시 참조만 제거 (하위 카드 유지)
    - 하위 티켓 Delivery Point 통과 시 완료 상태 자동 갱신
    - _Requirements: 9.1, 9.2, 9.4, 9.6, 9.7, 9.8_
  - [x] 7.3 블로커/하위 티켓 서버 통합 테스트
    - _Requirements: 8.1~8.7, 9.1~9.8_

- [x] 8. 체크포인트 - 서버 API 전체 검증
  - 모든 서버 테스트 통과 확인, 문제 발생 시 사용자에게 확인

- [x] 9. 메트릭 서버 구현
  - [x] 9.1 일별 스냅샷 스케줄러 구현
    - `server/api/helpers/metrics/generate-daily-snapshot.js` 작성
    - node-cron으로 매일 자정(UTC) 모든 활성 보드의 컬럼별 카드 수 기록
    - Sails.js bootstrap에서 스케줄러 등록
    - _Requirements: 6.1_
  - [x] 9.2 메트릭 계산 헬퍼 구현
    - calculate-cfd.js: board_daily_snapshot 기반 CFD 데이터 조회
    - calculate-lead-time.js: card_commitment_log + completed_at 기반 Lead Time 분포 계산
    - calculate-throughput.js: 주 단위 완료 건수 계산
    - calculate-wip-aging.js: 현재 진행 중 카드의 컬럼별 체류 일수 계산
    - Little's Law 요약: 평균 WIP / 일 평균 Delivery Rate
    - _Requirements: 6.1~6.7_
  - [x] 9.3 메트릭 컨트롤러 구현
    - `server/api/controllers/metrics/` 에 show-cfd.js, show-lead-time.js, show-throughput.js, show-wip-aging.js 작성
    - 날짜 범위 필터 (기본 30일, 최소 1일~최대 365일)
    - Class of Service별 필터
    - 보드 멤버 권한 검증
    - _Requirements: 6.8, 6.9, 6.10_
  - [x] 9.4 메트릭 서버 통합 테스트
    - 스냅샷 생성, CFD/Lead Time/Throughput/WIP Aging 계산 정확성 테스트
    - _Requirements: 6.1~6.10_

- [x] 10. 클라이언트 상태 관리 기반 구축
  - [x] 10.1 Redux-ORM 모델 및 액션 정의
    - `client/src/models/` 에 SwimLane, CommitmentPoint, ClassOfService, Decorator, Blocker, CardRelationship, BoardDailySnapshot 모델 생성
    - `client/src/actions/` 에 swim-lanes.js, commitment-points.js, classes-of-service.js, blockers.js, card-relationships.js, decorators.js, card-decorators.js, metrics.js 액션 파일 생성
    - _Requirements: 1~10 전체_
  - [x] 10.2 Redux-Saga 비동기 로직 구현
    - `client/src/sagas/` 에 각 도메인별 saga 파일 생성
    - API 호출, 성공/실패 처리, WebSocket 이벤트 수신 처리
    - _Requirements: 1~10 전체_
  - [x] 10.3 셀렉터 구현
    - `client/src/selectors/` 에 swim-lanes.js, commitment-points.js, classes-of-service.js, blockers.js, card-relationships.js, metrics.js 생성
    - WIP 카운트, 빈 슬롯 수, SLA 진행률, 티켓 나이 등 파생 데이터 메모이제이션
    - _Requirements: 2.1, 2.5, 4.5, 4.10, 10.1, 10.3_
  - [x] 10.4 클라이언트 상태 관리 단위 테스트
    - 셀렉터 메모이제이션, 액션 크리에이터, 리듀서 테스트 (Jest)
    - _Requirements: 1~10 전체_

- [x] 11. 스윔레인 및 컬럼 구조 UI 구현
  - [x] 11.1 스윔레인 UI 컴포넌트 구현
    - SwimLane.jsx, SwimLaneHeader.jsx, SwimLaneSettings.jsx, AddSwimLaneButton.jsx 작성
    - 스윔레인 헤더에 WIP 현재/제한 표시, 초과 시 빨간색 강조
    - 드래그 앤 드롭 순서 변경 (Expedite 제외)
    - _Requirements: 1.1~1.8_
  - [x] 11.2 WIP 제한 및 Pull 시스템 UI 구현
    - WipLimitIndicator.jsx, PullSlot.jsx, PullArrow.jsx, PullableCardHighlight.jsx, SystemWipIndicator.jsx 작성
    - 컬럼 헤더에 "현재수/제한값" 표시, 초과 시 빨간색
    - 빈 슬롯 점선 카드 표시, Pull 방향 화살표
    - WIP 초과 이동 시 확인 대화상자
    - _Requirements: 2.1~2.7, 10.1~10.6_
  - [x] 11.3 서브컬럼 및 버퍼 컬럼 UI 구현
    - SubColumn.jsx, PullCriteriaPopover.jsx, PolicyPopover.jsx, ColumnSettings.jsx 작성
    - Active/Done 서브컬럼 분할 표시
    - 버퍼 컬럼 시각적 구분 (점선 테두리)
    - Pull Criteria/Policy 텍스트 2줄 표시 + 팝오버
    - _Requirements: 7.1~7.7_
  - [x] 11.4 스윔레인/컬럼 UI 단위 테스트
    - 컴포넌트 렌더링, WIP 표시 로직, 드래그 앤 드롭 테스트 (Jest)
    - _Requirements: 1.1~1.8, 2.1~2.7, 7.1~7.7_

- [x] 12. Commitment Point 및 서비스 클래스 UI 구현
  - [x] 12.1 Commitment Point UI 구현
    - CommitmentPointLine.jsx, CommitmentPointSettings.jsx 작성
    - 컬럼 사이 구분선(점선) 표시
    - 라벨 표시 및 설정 UI
    - _Requirements: 3.1, 3.2, 3.5_
  - [x] 12.2 서비스 클래스 UI 구현
    - ClassOfServiceList.jsx, ClassOfServicePicker.jsx, CardClassOfServiceStripe.jsx 작성
    - 카드 좌측 4px 색상 띠 표시
    - Fixed_Date 카운트다운, Expedite 최상단 배치
    - CoS 관리 화면 (기본 4종 + 사용자 정의 최대 10개)
    - _Requirements: 5.1~5.8_
  - [x] 12.3 Commitment Point/서비스 클래스 UI 단위 테스트
    - _Requirements: 3.1~3.7, 5.1~5.8_

- [x] 13. 칸반 카드 정보 강화 UI 구현
  - [x] 13.1 카드 핵심 정보 표시 컴포넌트 구현
    - CardSlaBar.jsx, CardPriority.jsx, CardTicketAge.jsx, CardDecoratorIcons.jsx 작성
    - SLA 진행 바 (녹색→주황색 80%→빨간색 100%)
    - 우선순위 문자 표시 (H/M/L)
    - 티켓 나이 일수 표시
    - 데코레이터 아이콘 최대 5개 표시
    - _Requirements: 4.5~4.10, 4.12_
  - [x] 13.2 블로커 및 하위 티켓 카드 표시 구현
    - CardBlockerBadge.jsx, CardSubTicketProgress.jsx 작성
    - 블로커 아이콘 + 사유 텍스트 30자 표시
    - 하위 티켓 진행률 프로그레스 바 ("완료수/전체수")
    - _Requirements: 4.11, 9.3_
  - [x] 13.3 카드 상세 화면 확장 (블로커/하위 티켓 섹션)
    - BlockerSection.jsx, SubTicketSection.jsx 작성
    - 블로커 등록/해결/연결 카드 생성 UI
    - 하위 티켓 목록 (제목, 컬럼명, 담당자, 완료 여부)
    - 새 하위 티켓 생성 버튼
    - 상위 카드 역참조 링크
    - _Requirements: 8.1~8.7, 9.1~9.8_
  - [x] 13.4 카드 정보 강화 UI 단위 테스트
    - SLA 바 색상 전환, 티켓 나이 계산, 블로커 배지 렌더링 테스트
    - _Requirements: 4.1~4.12, 8.1~8.7, 9.1~9.8_

- [x] 14. 체크포인트 - UI 컴포넌트 통합 검증
  - 모든 테스트 통과 확인, 문제 발생 시 사용자에게 확인

- [x] 15. 메트릭 대시보드 UI 구현
  - [x] 15.1 메트릭 대시보드 메인 및 필터 구현
    - MetricsDashboard.jsx, MetricsFilter.jsx 작성
    - 날짜 범위 필터 (기본 30일, 1~365일)
    - Class of Service별 필터
    - 데이터 부족 시 안내 메시지 표시
    - React.lazy + Suspense로 lazy loading
    - _Requirements: 6.8, 6.9, 6.10_
  - [x] 15.2 CFD 및 Lead Time 차트 구현
    - CfdChart.jsx, LeadTimeHistogram.jsx 작성 (Recharts)
    - CFD: 컬럼별 색상 밴드, 일 단위 시간축
    - Lead Time 히스토그램 + 85th percentile 기준선
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 15.3 Run Chart, WIP Aging Chart, Little's Law 요약 구현
    - RunChart.jsx, WipAgingChart.jsx, LittleLawSummary.jsx 작성 (Recharts)
    - Run Chart: 완료 카드 Lead Time 점 + 주 단위 Throughput 추이
    - WIP Aging: 컬럼별 현재 진행 카드 체류 일수
    - Little's Law: 예상 Lead Time = 평균 WIP / 일 평균 Delivery Rate
    - _Requirements: 6.5, 6.6, 6.7_
  - [x] 15.4 메트릭 대시보드 UI 단위 테스트
    - 차트 렌더링, 필터 동작, 데이터 부족 표시 테스트
    - _Requirements: 6.1~6.10_

- [x] 16. WebSocket 실시간 동기화 통합
  - [x] 16.1 서버 WebSocket 브로드캐스트 통합
    - 모든 신규 헬퍼에 WebSocket 브로드캐스트 코드 검증 및 보완
    - 기존 cardUpdate, listUpdate, boardUpdate 이벤트에 새 필드 포함 확인
    - _Requirements: 10.6 (1초 이내 갱신)_
  - [x] 16.2 클라이언트 WebSocket 이벤트 핸들러 통합
    - 신규 이벤트(swimLaneCreate/Update/Delete, commitmentPointCreate/Update/Delete 등) 수신 처리
    - Redux 스토어 실시간 갱신
    - Pull 시각화 상태 자동 갱신 (cardUpdate 이벤트 기반)
    - _Requirements: 10.6_
  - [x] 16.3 WebSocket 실시간 동기화 통합 테스트
    - 이벤트 발송/수신, 상태 갱신 정확성 테스트
    - _Requirements: 10.6_

- [x] 17. 보드 로딩 및 라우팅 통합
  - [x] 17.1 보드 데이터 로딩 확장
    - 보드 조회 API 응답에 swimLanes, commitmentPoints, classesOfService, decorators 포함
    - 클라이언트 보드 로딩 saga에서 신규 데이터 Redux 스토어에 저장
    - N+1 쿼리 방지를 위한 배치 로딩
    - _Requirements: 1~10 전체_
  - [x] 17.2 메트릭 대시보드 라우팅 추가
    - 보드 내 메트릭 대시보드 접근 경로 추가
    - 네비게이션 UI에 메트릭 대시보드 링크 추가
    - _Requirements: 6.1_

- [x] 18. 최종 체크포인트 - 전체 통합 검증
  - 모든 서버/클라이언트 테스트 통과 확인, 문제 발생 시 사용자에게 확인

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 각 태스크는 특정 요구사항을 참조하여 추적 가능성을 보장
- 체크포인트에서 점진적 검증을 수행하여 품질 확보
- DB 마이그레이션 → 서버 → 클라이언트 순서로 의존성을 따름
- WebSocket 통합은 개별 기능 구현 후 마지막에 일괄 검증
- Recharts는 클라이언트 package.json에 의존성 추가 필요
- node-cron은 서버 package.json에 의존성 추가 필요

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.5"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.2", "5.1", "6.1", "6.2"] },
    { "id": 3, "tasks": ["3.2", "4.3", "5.2", "6.3", "7.1", "7.2"] },
    { "id": 4, "tasks": ["3.3", "4.4", "5.3", "6.4", "7.3", "9.1"] },
    { "id": 5, "tasks": ["9.2", "9.3"] },
    { "id": 6, "tasks": ["9.4", "10.1"] },
    { "id": 7, "tasks": ["10.2", "10.3"] },
    { "id": 8, "tasks": ["10.4", "11.1", "11.2", "11.3"] },
    { "id": 9, "tasks": ["11.4", "12.1", "12.2"] },
    { "id": 10, "tasks": ["12.3", "13.1", "13.2"] },
    { "id": 11, "tasks": ["13.3", "13.4"] },
    { "id": 12, "tasks": ["15.1", "15.2", "15.3"] },
    { "id": 13, "tasks": ["15.4", "16.1"] },
    { "id": 14, "tasks": ["16.2", "16.3"] },
    { "id": 15, "tasks": ["17.1", "17.2"] }
  ]
}
```
