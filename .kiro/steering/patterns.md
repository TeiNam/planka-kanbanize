# Common Pattern Rules (Planka)

## When Implementing New Features

1. 기존 Planka 코드에서 유사한 기능 패턴 검색
2. 보안 평가, 확장성 분석, 구현 계획 수행
3. 기존 패턴을 기반으로 구현
4. 검증된 구조 내에서 반복

## Sails.js Controller Pattern

Planka의 컨트롤러 구조를 따를 것:
```javascript
// server/api/controllers/[resource]/[action].js
module.exports = {
  inputs: {
    // 입력 스키마 정의 (검증 자동 적용)
  },
  exits: {
    // 응답 타입 정의
  },
  async fn(inputs) {
    // 비즈니스 로직 (헬퍼 호출)
  },
};
```

## Sails.js Helper Pattern

비즈니스 로직은 헬퍼로 분리:
```javascript
// server/api/helpers/[domain]/[action].js
module.exports = {
  inputs: {
    // 입력 정의
  },
  async fn(inputs) {
    // 로직 구현
  },
};
```

## Redux-Saga Pattern

비동기 로직은 Saga로 처리:
```javascript
// client/src/sagas/[resource].js
function* fetchResourceSaga(action) {
  try {
    const response = yield call(api.fetchResource, action.payload);
    yield put(actions.fetchResourceSuccess(response));
  } catch (error) {
    yield put(actions.fetchResourceFailure(error));
  }
}
```

## Knex Migration Pattern

스키마 변경은 마이그레이션으로:
```javascript
// server/db/migrations/YYYYMMDDHHMMSS_description.js
exports.up = (knex) =>
  knex.schema.createTable('table_name', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.text('name').notNullable();
    table.timestamp('created_at', true).notNullable();
    table.timestamp('updated_at', true);
  });

exports.down = (knex) => knex.schema.dropTable('table_name');
```

## WebSocket Real-time Update Pattern

실시간 업데이트 브로드캐스트:
- 데이터 변경 후 관련 보드 구독자에게 WebSocket 이벤트 발송
- 이벤트 타입: create, update, delete
- 수신자 범위: 해당 보드 멤버만

## API Response Format

Planka의 기존 응답 형식을 따를 것:
```javascript
// 단일 리소스
{ item: { ...resource } }

// 목록
{ items: [...resources] }

// 포함된 관계
{ item: { ...resource }, included: { relatedItems: [...] } }
```

## File Naming Conventions

- 서버 컨트롤러: `kebab-case.js` (예: `create-one.js`)
- 서버 모델: `PascalCase.js` (예: `Card.js`)
- 서버 헬퍼: `kebab-case.js` (예: `create-one.js`)
- 클라이언트 컴포넌트: `PascalCase.jsx` (예: `CardModal.jsx`)
- 클라이언트 스타일: `PascalCase.module.scss`
- 마이그레이션: `YYYYMMDDHHMMSS_description.js`
