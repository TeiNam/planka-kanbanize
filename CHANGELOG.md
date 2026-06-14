# Changelog

이 프로젝트의 주요 변경 사항을 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전 관리는 [Semantic Versioning](https://semver.org/lang/ko/)을 지향합니다.

## [Unreleased]

### Added
- **프로젝트 레벨 캘린더 보드**: 보드 헤더 우측의 캘린더 토글로 진입하는 월간 캘린더 뷰 추가.
  - 일정(Event)은 프로젝트 단위로 공유되며 하루 종일(all-day)/시간 단위(time-based) 두 종류를 지원하고 생성·수정·삭제 및 WebSocket 실시간 동기화를 제공.
  - 같은 프로젝트의 모든 보드에서 동일한 캘린더를 공유.
  - 마감일(dueDate)이 설정된 **task 리스트의 카드**를 프로젝트 전체 보드에서 모아 읽기 전용으로 표시(백로그/완료/폐기 리스트 제외). 클릭 시 해당 카드로 이동.
  - 외부 공휴일 API 연동(프로젝트 단위 엔드포인트 설정, 프로젝트 관리자만 변경 가능). 미설정/오류 시 캘린더 핵심 기능은 비차단.
  - 일요일/공휴일 날짜는 빨간색으로 강조, 오늘 날짜 강조 표시.

### Changed
- 보드 뷰 토글 그룹에서 캘린더 항목을 제거하고, 공통 헤더 우측 메뉴(즐겨찾기 → 캘린더 → 알림 → 편집모드 순)로 진입점을 이동.

### Fixed
- 카드 완료 처리(`completedAt`)를 **done(closed) 컬럼**(및 'done' 서브컬럼)으로 이동할 때만 적용하도록 수정. **discard(폐기)는 더 이상 완료로 집계되지 않음** — Lead Time/Throughput/CFD/WIP 등 메트릭에 일관 반영.
- Lead Time Distribution이 Commitment Point 미설정 보드에서도 완료 카드를 집계하도록 시작 기준 폴백 추가(커밋먼트 통과 시점 → 없으면 카드 startDate → createdAt).
- WIP Aging이 task 컬럼을 서브컬럼(sub-column)으로 분할해 쓰는 보드에서도 표시되도록 수정. 진행 중 task 컬럼의 서브컬럼 카드를 부모 컬럼 기준으로 집계(기존에는 최상위 컬럼만 조회해 서브컬럼 카드가 누락됨).
