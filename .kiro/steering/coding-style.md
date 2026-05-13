# Coding Style Rules (Planka — Node.js + React)

## Immutability (CRITICAL)

항상 새 객체를 생성하고, 기존 객체를 변경하지 않음:

```javascript
// 잘못된 예
user.name = 'new name';
array.push(item);

// 올바른 예
const updatedUser = { ...user, name: 'new name' };
const newArray = [...array, item];
```

Redux 상태는 반드시 불변 업데이트 패턴 사용.

## File Organization

작은 파일 여러 개 > 큰 파일 소수:
- 높은 응집도, 낮은 결합도
- 파일당 200–400줄, 최대 800줄
- 큰 모듈은 분리
- 기능/도메인 기준으로 구성

### Planka 프로젝트 구조 규칙

**서버 (Sails.js):**
- 컨트롤러: `server/api/controllers/` — 리소스별 디렉토리
- 모델: `server/api/models/` — Waterline 모델
- 헬퍼: `server/api/helpers/` — 도메인별 디렉토리
- 정책: `server/api/policies/` — 인증/인가 미들웨어
- 마이그레이션: `server/db/migrations/` — Knex 마이그레이션

**클라이언트 (React + Redux):**
- 컴포넌트: `client/src/components/` — 기능별 디렉토리
- 액션: `client/src/actions/` — Redux 액션 크리에이터
- 리듀서: `client/src/reducers/` — Redux 리듀서
- Saga: `client/src/sagas/` — Redux-Saga 비동기 로직
- 셀렉터: `client/src/selectors/` — Reselect 셀렉터
- 모델: `client/src/models/` — Redux-ORM 모델

## Functions

- 작고, 집중적이며, 의미 있는 이름
- 함수당 50줄 이하
- 비자명한 코드에만 주석 작성

## Error Handling

항상 포괄적으로 에러 처리:
- 모든 레벨에서 명시적으로 에러 처리
- UI 코드에서는 사용자 친화적 에러 메시지 제공
- 서버에서는 상세한 에러 컨텍스트 로깅 (Winston 사용)
- 에러를 절대 조용히 삼키지 않음
- Sails.js 커스텀 응답 활용 (`res.badRequest()`, `res.forbidden()` 등)

## Input Validation

시스템 경계에서 항상 검증:
- 모든 사용자 입력을 처리 전 검증
- Sails.js 컨트롤러에서 `inputs` 정의로 스키마 검증
- 실패 시 명확한 에러 메시지 제공
- 외부 데이터를 절대 신뢰하지 않음

## Naming Conventions

- **파일명:** camelCase (서버), PascalCase (React 컴포넌트)
- **변수/함수:** camelCase
- **클래스/컴포넌트:** PascalCase
- **상수:** UPPER_SNAKE_CASE
- **DB 컬럼:** snake_case (Knex 마이그레이션)
- **Redux 액션 타입:** UPPER_SNAKE_CASE

## Code Quality Checklist

작업 완료 전 확인:
- [ ] 코드가 읽기 쉽고 이름이 잘 선택됨
- [ ] 함수가 작음 (<50줄)
- [ ] 파일이 집중적 (<800줄)
- [ ] 깊은 중첩 없음 (>4단계)
- [ ] 적절한 에러 처리
- [ ] 하드코딩된 값 없음 (상수 또는 설정 사용)
- [ ] 불변 패턴 사용 (mutation 없음)
- [ ] 주석 처리된 코드, console.log 없음
- [ ] ESLint + Prettier 통과
