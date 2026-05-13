# Implementation Plan: Blocker Multi-Card Linking

## Overview

블로커의 단일 `linked_card_id` FK 방식을 `blocker_linked_card` 조인 테이블 기반 M:N 구조로 전환한다. DB 마이그레이션 → 서버 모델/헬퍼/컨트롤러 → 클라이언트 상태/UI 순서로 점진적으로 구현하며, 기존 create-linked-card 기능과 SubTicketSection 컴포넌트를 제거한다.

## Tasks

- [x] 1. DB 마이그레이션 및 Waterline 모델 생성
  - [x] 1.1 blocker_linked_card 조인 테이블 마이그레이션 생성
    - `server/db/migrations/YYYYMMDDHHMMSS_add_blocker_linked_card_table.js` 작성
    - blocker_linked_card 테이블 생성 (id, blocker_id, card_id, position, created_at)
    - UNIQUE(blocker_id, card_id) 제약 조건 추가
    - blocker_id, card_id 인덱스 생성
    - 기존 blocker.linked_card_id 데이터를 blocker_linked_card로 마이그레이션
    - blocker 테이블에서 linked_card_id 컬럼 제거
    - down 함수에서 롤백 로직 구현 (linked_card_id 복원)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.2 BlockerLinkedCard Waterline 모델 생성
    - `server/api/models/BlockerLinkedCard.js` 작성
    - position, blockerId(FK → Blocker), cardId(FK → Card) 속성 정의
    - 기존 Blocker 모델에서 linkedCardId 속성 제거
    - _Requirements: 1.1, 1.5_

  - [ ]* 1.3 마이그레이션 정합성 통합 테스트 작성
    - 마이그레이션 실행 후 기존 linked_card_id 데이터가 blocker_linked_card에 정확히 매핑되는지 검증
    - 롤백 후 linked_card_id 복원 검증
    - **Property 9: 데이터 마이그레이션 정합성**
    - **Validates: Requirements 1.6**

- [x] 2. 체크포인트 - DB 마이그레이션 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. 블로커 카드 연결 서버 API 구현
  - [x] 3.1 blocker-linked-cards/create 컨트롤러 구현
    - `server/api/controllers/blocker-linked-cards/create.js` 작성
    - inputs: blockerId(path param), cardId(body)
    - 블로커 경로 조회 및 보드 멤버십/EDITOR 권한 검증
    - 중복 연결 확인 (409 Conflict)
    - 자기 자신 연결 방지 (블로커의 cardId와 대상 cardId 비교)
    - position 계산 (기존 연결 카드의 마지막 position + 65536)
    - blocker_linked_card 레코드 생성
    - WebSocket 브로드캐스트 (blockerLinkedCardCreate)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 blocker-linked-cards/delete 컨트롤러 구현
    - `server/api/controllers/blocker-linked-cards/delete.js` 작성
    - inputs: id(path param)
    - 연결 레코드 조회 및 보드 멤버십/EDITOR 권한 검증
    - blocker_linked_card 레코드 삭제
    - WebSocket 브로드캐스트 (blockerLinkedCardDelete)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.3 API 라우트 등록
    - `server/config/routes.js`에 추가:
      - `POST /api/blockers/:blockerId/linked-cards` → `blocker-linked-cards/create`
      - `DELETE /api/blocker-linked-cards/:id` → `blocker-linked-cards/delete`
    - _Requirements: 2.1, 3.1_

  - [ ]* 3.4 카드 연결 API 통합 테스트 작성
    - 정상 연결 생성/삭제 테스트
    - 중복 연결 시 409 응답 테스트
    - 비EDITOR 권한 시 403 응답 테스트
    - 존재하지 않는 블로커/카드 시 404 응답 테스트
    - 자기 자신 연결 시도 시 409 응답 테스트
    - **Property 1: 중복 연결 방지**
    - **Property 3: EDITOR 권한 필수**
    - **Property 4: 연결 생성 정합성**
    - **Property 5: 연결 삭제 정합성**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3**

- [x] 4. 블로커 자동 해결 서버 로직 구현
  - [x] 4.1 auto-resolve 헬퍼 구현
    - `server/api/helpers/blockers/auto-resolve.js` 작성
    - card_id로 blocker_linked_card 조회하여 관련 활성 블로커 목록 획득
    - 각 블로커의 모든 연결 카드 completedAt 확인
    - 모든 카드 완료 시 블로커 status → resolved, resolvedAt → now()
    - 연결 카드 0개인 블로커는 자동 해결 대상 제외
    - WebSocket 브로드캐스트 (blockerUpdate)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 카드 완료 상태 변경 시 auto-resolve 트리거 연결
    - `server/api/helpers/cards/update-one.js`에서 completedAt 변경 감지 시 auto-resolve 헬퍼 호출
    - _Requirements: 4.1_

  - [ ]* 4.3 자동 해결 통합 테스트 작성
    - 모든 연결 카드 완료 시 블로커 자동 resolved 테스트
    - 일부 카드만 완료 시 블로커 active 유지 테스트
    - 연결 카드 0개인 블로커 자동 해결 미수행 테스트
    - **Property 6: 자동 해결 조건**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 5. 체크포인트 - 서버 API 전체 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. 기존 기능 제거 (서버)
  - [x] 6.1 create-linked-card 서버 코드 제거
    - `server/api/controllers/blockers/create-linked-card.js` 삭제
    - `server/api/helpers/blockers/create-linked-card.js` 삭제
    - `server/config/routes.js`에서 create-linked-card 라우트 제거
    - _Requirements: 6.1, 6.2_

- [x] 7. 클라이언트 상태 관리 구현
  - [x] 7.1 BlockerLinkedCard Redux-ORM 모델 생성
    - `client/src/models/BlockerLinkedCard.js` 작성
    - id, position, blockerId(FK → Blocker), cardId(FK → Card) 필드 정의
    - reducer: CREATE, CREATE_HANDLE, CREATE__SUCCESS, DELETE, DELETE_HANDLE 액션 처리
    - ORM 레지스트리에 모델 등록
    - _Requirements: 2.1, 3.1_

  - [x] 7.2 blocker-linked-cards 액션 및 ActionTypes 정의
    - `client/src/actions/blocker-linked-cards.js` 작성
    - createBlockerLinkedCard, deleteBlockerLinkedCard 액션 크리에이터
    - `client/src/constants/ActionTypes.js`에 BLOCKER_LINKED_CARD_* 타입 추가
    - _Requirements: 2.1, 3.1_

  - [x] 7.3 blocker-linked-cards Redux-Saga 구현
    - `client/src/sagas/core/services/blocker-linked-cards.js` 작성
    - createBlockerLinkedCard: optimistic create → API 호출 → success/failure
    - deleteBlockerLinkedCard: optimistic delete → API 호출 → success/failure
    - WebSocket 이벤트 핸들러 (blockerLinkedCardCreate, blockerLinkedCardDelete) 등록
    - _Requirements: 2.1, 2.5, 3.1, 3.4_

  - [x] 7.4 blocker-linked-cards API 클라이언트 함수 작성
    - `client/src/api/blocker-linked-cards.js` 작성
    - createBlockerLinkedCard(blockerId, data), deleteBlockerLinkedCard(id) 함수
    - _Requirements: 2.1, 3.1_

  - [x] 7.5 blocker-linked-cards 셀렉터 구현
    - `client/src/selectors/blocker-linked-cards.js` 작성
    - makeSelectLinkedCardsByBlockerId: 블로커별 연결 카드 목록 (position 정렬, 카드 정보 포함)
    - _Requirements: 5.4_

  - [ ]* 7.6 클라이언트 상태 관리 단위 테스트 작성
    - BlockerLinkedCard 모델 reducer 테스트
    - makeSelectLinkedCardsByBlockerId 셀렉터 테스트
    - **Property 7: 카드 검색 필터링**
    - **Validates: Requirements 5.2, 5.4**

- [x] 8. 블로커 UI 위치 변경 및 카드 연결 기능 구현
  - [x] 8.1 BlockerSection을 카드 본문에서 사이드바 버튼 방식으로 이동
    - `StoryContent.jsx`, `ProjectContent.jsx`에서 본문 영역의 BlockerSection 렌더링 제거
    - 사이드바 "Add to Card" 섹션 아래(actions 영역)에 "Blockers" 버튼 추가
    - 버튼 클릭 시 블로커 관리 팝업/패널 표시 (블로커 목록 + 카드 연결 UI 포함)
    - EDITOR 권한 시에만 버튼 표시
    - _Requirements: 5.1, 5.3_

  - [x] 8.2 BlockerItem 컴포넌트에 연결 카드 목록 표시 추가
    - 기존 `client/src/components/cards/BlockerSection/` 내 BlockerItem 수정
    - 연결된 카드 목록 렌더링 (카드 이름 + 완료 상태 아이콘)
    - 카드 이름 클릭 시 해당 카드 상세 모달로 이동
    - 연결 카드 제거 버튼 (EDITOR 권한 시에만 표시)
    - _Requirements: 5.4, 5.5, 5.6_

  - [x] 8.3 카드 검색 드롭다운 구현
    - BlockerItem에 카드 연결 버튼 추가 (EDITOR 권한 시에만 표시)
    - Semantic UI `Dropdown` with `search` 활용
    - 현재 보드의 카드 목록에서 검색
    - 이미 연결된 카드 및 블로커 소유 카드 필터링 제외
    - 카드 선택 시 createBlockerLinkedCard 액션 디스패치
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 8.4 블로커 UI 단위 테스트 작성
    - 연결 카드 목록 렌더링 테스트
    - 카드 검색 필터링 로직 테스트
    - 권한별 버튼 표시/숨김 테스트
    - **Property 7: 카드 검색 필터링**
    - **Property 8: 연결 카드 정보 표시**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**

- [x] 9. 기존 기능 제거 (클라이언트)
  - [x] 9.1 SubTicketSection 컴포넌트 및 관련 코드 제거
    - `client/src/components/cards/SubTicketSection/` 디렉토리 삭제
    - `ProjectContent.jsx`, `StoryContent.jsx`에서 SubTicketSection import 및 렌더링 제거
    - _Requirements: 7.1, 7.2_

  - [x] 9.2 SubTicketSection 관련 셀렉터 제거
    - `client/src/selectors/card-relationships.js`에서 makeSelectChildRelationshipsByCardId, makeSelectSubTicketProgress, makeSelectParentRelationshipByCardId 제거
    - 관련 테스트 파일 정리
    - _Requirements: 7.3_

  - [x] 9.3 기존 createLinkedCard 액션/사가 제거
    - `client/src/actions/blockers.js`에서 createLinkedCard 관련 액션 제거
    - `client/src/sagas/core/services/blockers.js`에서 createLinkedCard 사가 제거
    - "Create Linked Card" 버튼 및 관련 이벤트 핸들러 제거
    - _Requirements: 6.3, 6.4_

- [x] 10. 보드 데이터 로딩 통합
  - [x] 10.1 보드 조회 시 blockerLinkedCards 데이터 포함
    - 보드 조회 API 응답에 blockerLinkedCards 포함하도록 서버 수정
    - 클라이언트 보드 로딩 saga에서 blockerLinkedCards를 Redux 스토어에 저장
    - _Requirements: 2.1, 5.4_

- [ ] 11. CASCADE 삭제 및 WebSocket 통합 검증
  - [ ]* 11.1 CASCADE 삭제 통합 테스트 작성
    - 블로커 삭제 시 관련 blocker_linked_card 레코드 자동 삭제 검증
    - 카드 삭제 시 관련 blocker_linked_card 레코드 자동 삭제 검증
    - orphan 레코드 미존재 검증
    - **Property 2: CASCADE 삭제 무결성**
    - **Validates: Requirements 1.3, 1.4**

- [x] 12. 최종 체크포인트 - 전체 통합 검증
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 각 태스크는 특정 요구사항을 참조하여 추적 가능성을 보장
- 체크포인트에서 점진적 검증을 수행하여 품질 확보
- DB 마이그레이션 → 서버 → 클라이언트 순서로 의존성을 따름
- 기존 create-linked-card 제거는 새 API 구현 후 수행하여 기능 공백 방지
- SubTicketSection 제거 시 card_relationship 테이블의 sub_ticket 타입 데이터는 DB에 유지 (Requirement 7.4)
- Property-based 테스트는 서버 통합 테스트 내에서 다양한 입력 조합으로 검증

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 5, "tasks": ["7.1", "7.2"] },
    { "id": 6, "tasks": ["7.3", "7.4", "7.5"] },
    { "id": 7, "tasks": ["7.6", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4", "9.1", "9.2", "9.3"] },
    { "id": 10, "tasks": ["10.1"] },
    { "id": 11, "tasks": ["11.1"] }
  ]
}
```
