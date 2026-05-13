# Product Development (Planka)

## Principles
- **KISS / YAGNI / DRY**: Keep it simple, build only what's needed now, extract duplication
- Make it work → Make it right → Make it fast (only when needed)
- Ship over perfect. Iterate based on usage data
- Planka의 기존 아키텍처 패턴을 존중하고 따를 것

## Workflow Constraints
- **Never run code directly via terminal** (dev server, watch mode 등)
- **Never use `cat <<EOF` to create files** — use fsWrite or fsAppend tools instead
- **Never pipe long text through terminal commands** — use fsWrite or fsAppend tools instead
- Never commit commented-out code, console.log, or print statements
- Comment only non-obvious code

## Planka Architecture Decisions

### 서버 (Sails.js)
- 새 기능은 기존 Sails.js MVC 패턴을 따를 것
- 컨트롤러 → 헬퍼 → 모델 계층 구조 유지
- 실시간 업데이트는 WebSocket (sails.io.js) 활용
- 인증/인가는 policies로 처리

### 클라이언트 (React + Redux)
- 상태 관리: Redux + Redux-Saga + Redux-ORM
- 새 컴포넌트는 기존 Semantic UI React 패턴 따를 것
- 비동기 로직은 Redux-Saga로 처리
- 실시간 동기화는 socket.io-client 활용

### 데이터베이스
- 스키마 변경은 반드시 Knex 마이그레이션으로
- camelCase → snake_case 자동 변환 규칙 유지
- 새 모델은 Waterline 모델 + Knex 마이그레이션 쌍으로 생성

## Automation
- Formatting: Prettier
- Linting: ESLint (airbnb 규칙)
- Pre-commit: Husky + lint-staged
- Tests: Mocha (서버) + Jest (클라이언트) + Playwright (E2E)
- Docker: 멀티스테이지 빌드

## Acceptable Rule Relaxation
- Prototyping: skip tests OK
- Debugging: temporary console.log OK (커밋 전 제거)
- Exploring patterns: copy-paste OK
