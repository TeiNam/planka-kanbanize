# Testing Rules (Planka)

## Minimum Test Coverage: 70% on Critical Paths

Test types (all required):
1. **Unit Tests** — 핵심 비즈니스 로직, 헬퍼 함수, 유틸리티
2. **Integration Tests** — API 엔드포인트, 데이터베이스 연산, 인증 플로우
3. **E2E Tests** — 핵심 사용자 플로우 (Cucumber + Playwright)

## Test Frameworks

- **서버 단위/통합:** Mocha + Chai + Supertest
- **클라이언트 단위:** Jest
- **E2E:** Cucumber.js + Playwright

## Running Tests

- **Never use `cd` to change directories before running tests** — always use the `cwd` parameter in executeBash instead
- 서버 테스트: `npm run server:test` (cwd: ~/dev/planka)
- 클라이언트 테스트: `npm run client:test` (cwd: ~/dev/planka)
- E2E 테스트: `npm run client:test:acceptance` (cwd: ~/dev/planka)
- 린트: `npm run lint` (cwd: ~/dev/planka)

## TDD Workflow (Required)

1. 테스트 먼저 작성 (RED)
2. 테스트 실행 — 반드시 실패해야 함
3. 최소 구현 작성 (GREEN)
4. 테스트 실행 — 반드시 통과해야 함
5. 리팩토링 (IMPROVE)
6. 커버리지 확인 (70%+)

## Planka-Specific Test Patterns

### 서버 통합 테스트 (Supertest)
```javascript
const request = require('supertest');

describe('POST /api/access-tokens', () => {
  it('유효한 자격증명으로 JWT 토큰을 반환해야 함', async () => {
    const res = await request(sails.hooks.http.app)
      .post('/api/access-tokens')
      .send({ emailOrUsername: 'admin', password: 'password' })
      .expect(200);

    expect(res.body).to.have.property('item');
    expect(res.body.item).to.have.property('token');
  });
});
```

### 클라이언트 단위 테스트 (Jest)
```javascript
import { selectCardById } from '../selectors/cards';

describe('selectCardById', () => {
  it('ID로 카드를 반환해야 함', () => {
    const state = { /* mock state */ };
    const result = selectCardById(state, 'card-1');
    expect(result).toBeDefined();
    expect(result.id).toBe('card-1');
  });
});
```

## Required Edge Cases to Test

1. **Null/Undefined** 입력
2. **빈** 배열/문자열
3. **잘못된 타입** 전달
4. **경계값** (min/max, 빈 보드, 카드 제한)
5. **에러 경로** (네트워크 실패, DB 에러, 인증 실패)
6. **동시성** (WebSocket 동시 업데이트, 동시 카드 이동)
7. **대용량 데이터** (수백 개 카드, 대량 첨부파일)
8. **특수 문자** (유니코드, 이모지, SQL 특수문자)
9. **권한** (비인가 접근, 다른 프로젝트 리소스 접근 시도)

## Test Anti-Patterns (Avoid)

- 구현 세부사항 테스트 (내부 상태) — 동작을 테스트할 것
- 테스트 간 의존성 (공유 상태, DB 상태 의존)
- 너무 적은 assertion (아무것도 검증하지 않는 통과 테스트)
- 외부 의존성 미모킹 (DB, WebSocket, 파일 시스템)
- Sails 앱 부트스트랩 없이 통합 테스트 실행

## Test Best Practices

1. **테스트 먼저 작성** — Always TDD
2. **테스트당 하나의 assertion** — 단일 동작에 집중
3. **서술적 테스트 이름** — 무엇을 테스트하는지 설명
4. **Arrange-Act-Assert** — 명확한 테스트 구조
5. **외부 의존성 모킹** — 단위 테스트 격리
6. **엣지 케이스 테스트** — null, undefined, empty, large
7. **에러 경로 테스트** — happy path만이 아닌
8. **테스트 빠르게 유지** — 단위 테스트 각 50ms 이하
9. **테스트 후 정리** — DB 상태 복원, 부작용 없음
10. **커버리지 리포트 확인** — 갭 식별
