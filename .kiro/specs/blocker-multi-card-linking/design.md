# Design Document: Blocker Multi-Card Linking

## Architecture Overview

블로커에 다수의 카드를 연결하기 위해 기존 단일 `linked_card_id` FK 방식을 `blocker_linked_card` 조인 테이블 기반 M:N 구조로 전환한다. 서버는 Sails.js MVC 패턴(Controller → Helper → Model)을 따르며, 클라이언트는 Redux-ORM + Redux-Saga 패턴을 유지한다.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                           │
│  BlockerSection ─→ Redux Actions ─→ Saga ─→ API Call            │
│       ↑                                        │                │
│  Redux-ORM Store ←── WebSocket Event ←─────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server (Sails.js)                           │
│  Controller ─→ Helper ─→ Waterline Model ─→ PostgreSQL          │
│       │                                                         │
│       └─→ WebSocket Broadcast (sails.sockets.broadcast)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL                                   │
│  blocker ──< blocker_linked_card >── card                       │
│  (1:N)              (M:N)              (1:N)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Layer

#### 1.1 blocker_linked_card 조인 테이블

```sql
CREATE TABLE blocker_linked_card (
  id          BIGINT PRIMARY KEY DEFAULT next_id(),
  blocker_id  BIGINT NOT NULL REFERENCES blocker(id) ON DELETE CASCADE,
  card_id     BIGINT NOT NULL REFERENCES card(id) ON DELETE CASCADE,
  position    DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (blocker_id, card_id)
);

CREATE INDEX idx_blocker_linked_card_blocker_id ON blocker_linked_card(blocker_id);
CREATE INDEX idx_blocker_linked_card_card_id ON blocker_linked_card(card_id);
```

#### 1.2 blocker 테이블 변경

- `linked_card_id` 컬럼 제거
- 기존 `linked_card_id` 데이터를 `blocker_linked_card`로 마이그레이션

### 2. Server Layer

#### 2.1 Waterline Model: BlockerLinkedCard

```javascript
// server/api/models/BlockerLinkedCard.js
module.exports = {
  attributes: {
    position: {
      type: 'number',
      required: true,
      columnName: 'position',
    },

    // Associations
    blockerId: {
      model: 'Blocker',
      required: true,
      columnName: 'blocker_id',
    },
    cardId: {
      model: 'Card',
      required: true,
      columnName: 'card_id',
    },
  },
};
```

#### 2.2 Controller: blocker-linked-cards/create

```javascript
// server/api/controllers/blocker-linked-cards/create.js
module.exports = {
  inputs: {
    blockerId: { type: 'string', required: true },
    cardId: { type: 'string', required: true },
  },
  exits: {
    notEnoughRights: { responseType: 'forbidden' },
    blockerNotFound: { responseType: 'notFound' },
    cardAlreadyLinked: { responseType: 'conflict' },
  },
  async fn(inputs) {
    // 1. 블로커 경로 조회 및 권한 검증
    // 2. 중복 연결 확인
    // 3. blocker_linked_card 레코드 생성
    // 4. WebSocket 브로드캐스트
    // 5. 생성된 레코드 반환
  },
};
```

#### 2.3 Controller: blocker-linked-cards/delete

```javascript
// server/api/controllers/blocker-linked-cards/delete.js
module.exports = {
  inputs: {
    id: { type: 'string', required: true },
  },
  exits: {
    notEnoughRights: { responseType: 'forbidden' },
    blockerLinkedCardNotFound: { responseType: 'notFound' },
  },
  async fn(inputs) {
    // 1. 연결 레코드 조회 및 권한 검증
    // 2. 레코드 삭제
    // 3. WebSocket 브로드캐스트
    // 4. 삭제된 레코드 반환
  },
};
```

#### 2.4 Helper: auto-resolve-blocker

```javascript
// server/api/helpers/blockers/auto-resolve.js
module.exports = {
  inputs: {
    card: { type: 'ref', required: true },
    board: { type: 'ref', required: true },
    request: { type: 'ref' },
  },
  async fn(inputs) {
    // 1. card_id로 blocker_linked_card 조회
    // 2. 각 연결된 활성 블로커에 대해:
    //    a. 해당 블로커의 모든 연결 카드 조회
    //    b. 모든 카드가 완료(completedAt != null)인지 확인
    //    c. 모두 완료이면 블로커를 resolved로 업데이트
    //    d. WebSocket 브로드캐스트
  },
};
```

#### 2.5 Auto-Resolve 트리거 위치

카드의 `completedAt` 필드가 변경되는 시점에 `auto-resolve` 헬퍼를 호출한다:
- `server/api/helpers/cards/update-one.js` 내에서 `completedAt` 변경 감지 시 호출

### 3. Client Layer

#### 3.1 Redux-ORM Model: BlockerLinkedCard

```javascript
// client/src/models/BlockerLinkedCard.js
import { attr, fk } from 'redux-orm';
import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'BlockerLinkedCard';

  static fields = {
    id: attr(),
    position: attr(),
    blockerId: fk({
      to: 'Blocker',
      as: 'blocker',
      relatedName: 'linkedCards',
    }),
    cardId: fk({
      to: 'Card',
      as: 'card',
      relatedName: 'blockerLinks',
    }),
  };

  static reducer({ type, payload }, BlockerLinkedCard) {
    switch (type) {
      case ActionTypes.BLOCKER_LINKED_CARD_CREATE:
      case ActionTypes.BLOCKER_LINKED_CARD_CREATE_HANDLE:
        BlockerLinkedCard.upsert(payload.blockerLinkedCard);
        break;
      case ActionTypes.BLOCKER_LINKED_CARD_CREATE__SUCCESS:
        BlockerLinkedCard.withId(payload.localId)?.delete();
        BlockerLinkedCard.upsert(payload.blockerLinkedCard);
        break;
      case ActionTypes.BLOCKER_LINKED_CARD_DELETE:
      case ActionTypes.BLOCKER_LINKED_CARD_DELETE_HANDLE: {
        const model = BlockerLinkedCard.withId(payload.blockerLinkedCard.id);
        if (model) model.delete();
        break;
      }
      default:
    }
  }
}
```

#### 3.2 Selector: makeSelectLinkedCardsByBlockerId

```javascript
// client/src/selectors/blocker-linked-cards.js
export const makeSelectLinkedCardsByBlockerId = () =>
  createSelector(
    orm,
    (_, blockerId) => blockerId,
    ({ Blocker }, blockerId) => {
      if (!blockerId) return [];
      const blockerModel = Blocker.withId(blockerId);
      if (!blockerModel) return [];
      return blockerModel.linkedCards
        .toModelArray()
        .sort((a, b) => a.position - b.position)
        .map((link) => ({
          ...link.ref,
          card: link.card?.ref,
        }));
    },
  );
```

#### 3.3 카드 검색 필터링 로직

```javascript
// BlockerSection 내 카드 검색 드롭다운 필터링
const filterCardsForLinking = (allCards, currentCardId, alreadyLinkedCardIds) => {
  return allCards.filter(
    (card) => card.id !== currentCardId && !alreadyLinkedCardIds.has(card.id),
  );
};
```

#### 3.4 Redux-Saga: blocker-linked-cards

```javascript
// client/src/sagas/core/services/blocker-linked-cards.js
export function* createBlockerLinkedCard(blockerId, data) {
  const localId = yield call(createLocalId);
  yield put(actions.createBlockerLinkedCard({ ...data, blockerId, id: localId }));

  let blockerLinkedCard;
  try {
    ({ item: blockerLinkedCard } = yield call(
      request, api.createBlockerLinkedCard, blockerId, data,
    ));
  } catch (error) {
    yield put(actions.createBlockerLinkedCard.failure(localId, error));
    return;
  }
  yield put(actions.createBlockerLinkedCard.success(localId, blockerLinkedCard));
}

export function* deleteBlockerLinkedCard(id) {
  yield put(actions.deleteBlockerLinkedCard(id));

  let blockerLinkedCard;
  try {
    ({ item: blockerLinkedCard } = yield call(request, api.deleteBlockerLinkedCard, id));
  } catch (error) {
    yield put(actions.deleteBlockerLinkedCard.failure(id, error));
    return;
  }
  yield put(actions.deleteBlockerLinkedCard.success(blockerLinkedCard));
}
```

### 4. API Routes

```javascript
// server/config/routes.js 추가
'POST /api/blockers/:blockerId/linked-cards': 'blocker-linked-cards/create',
'DELETE /api/blocker-linked-cards/:id': 'blocker-linked-cards/delete',
```

### 5. WebSocket Events

| Event Name | Payload | Trigger |
|---|---|---|
| `blockerLinkedCardCreate` | `{ item: blockerLinkedCard }` | 카드 연결 생성 |
| `blockerLinkedCardDelete` | `{ item: blockerLinkedCard }` | 카드 연결 해제 |
| `blockerUpdate` | `{ item: blocker }` | 자동 해결 시 블로커 상태 변경 |

### 6. UI Component: BlockerSection 변경

BlockerItem 컴포넌트에 다음 기능 추가:
- 연결된 카드 목록 표시 (이름 + 완료 상태 아이콘)
- 카드 검색 드롭다운 (Semantic UI `Dropdown` with `search`)
- 연결 카드 제거 버튼
- "Create Linked Card" 버튼 제거

### 7. 제거 대상

| 대상 | 파일 경로 |
|---|---|
| create-linked-card 컨트롤러 | `server/api/controllers/blockers/create-linked-card.js` |
| create-linked-card 헬퍼 | `server/api/helpers/blockers/create-linked-card.js` |
| create-linked-card 라우트 | `server/config/routes.js` 내 해당 라인 |
| SubTicketSection 컴포넌트 | `client/src/components/cards/SubTicketSection/` |
| SubTicketSection 관련 셀렉터 | `makeSelectChildRelationshipsByCardId`, `makeSelectSubTicketProgress`, `makeSelectParentRelationshipByCardId` |
| BLOCKER_LINKED_CARD_CREATE 액션 (기존) | `client/src/actions/blockers.js` 내 `createLinkedCard` |
| createLinkedCard 사가 | `client/src/sagas/core/services/blockers.js` 내 해당 함수 |

## Data Models

### blocker_linked_card (신규)

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, DEFAULT next_id() |
| blocker_id | BIGINT | NOT NULL, FK → blocker(id) ON DELETE CASCADE |
| card_id | BIGINT | NOT NULL, FK → card(id) ON DELETE CASCADE |
| position | DOUBLE PRECISION | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

**Indexes:**
- UNIQUE (blocker_id, card_id)
- INDEX (blocker_id)
- INDEX (card_id)

### blocker (변경)

| 변경 사항 | 설명 |
|---|---|
| `linked_card_id` 컬럼 제거 | 조인 테이블로 대체 |

## Interfaces

### REST API

#### POST /api/blockers/:blockerId/linked-cards

**Request:**
```json
{
  "cardId": "123456789"
}
```

**Response (200):**
```json
{
  "item": {
    "id": "987654321",
    "blockerId": "111111111",
    "cardId": "123456789",
    "position": 65536.0,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 403: 권한 부족 (EDITOR 아님)
- 404: 블로커 미존재
- 409: 이미 연결됨

#### DELETE /api/blocker-linked-cards/:id

**Response (200):**
```json
{
  "item": {
    "id": "987654321",
    "blockerId": "111111111",
    "cardId": "123456789",
    "position": 65536.0,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 403: 권한 부족
- 404: 연결 레코드 미존재

## Error Handling

| 시나리오 | HTTP Status | 처리 방식 |
|---|---|---|
| 블로커 미존재 | 404 | `pathNotFound` intercept |
| 권한 부족 (비EDITOR) | 403 | `notEnoughRights` exit |
| 중복 연결 | 409 | DB unique constraint catch → `cardAlreadyLinked` exit |
| 연결 대상 카드 미존재 | 404 | 카드 조회 실패 시 |
| 자기 자신 연결 시도 | 409 | 블로커의 cardId와 연결 대상 cardId 비교 |

## Migration Strategy

### Phase 1: 조인 테이블 생성 + 데이터 마이그레이션

```javascript
// server/db/migrations/YYYYMMDDHHMMSS_add_blocker_linked_card_table.js
exports.up = async (knex) => {
  // 1. blocker_linked_card 테이블 생성
  await knex.schema.createTable('blocker_linked_card', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));
    table.bigInteger('blocker_id').notNullable()
      .references('id').inTable('blocker').onDelete('CASCADE');
    table.bigInteger('card_id').notNullable()
      .references('id').inTable('card').onDelete('CASCADE');
    table.specificType('position', 'double precision').notNullable();
    table.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());

    table.unique(['blocker_id', 'card_id']);
    table.index('blocker_id');
    table.index('card_id');
  });

  // 2. 기존 linked_card_id 데이터 마이그레이션
  await knex.raw(`
    INSERT INTO blocker_linked_card (blocker_id, card_id, position, created_at)
    SELECT id, linked_card_id, 65536.0, created_at
    FROM blocker
    WHERE linked_card_id IS NOT NULL
  `);

  // 3. linked_card_id 컬럼 제거
  await knex.schema.alterTable('blocker', (table) => {
    table.dropColumn('linked_card_id');
  });
};

exports.down = async (knex) => {
  // 1. linked_card_id 컬럼 복원
  await knex.schema.alterTable('blocker', (table) => {
    table.bigInteger('linked_card_id');
  });

  // 2. 데이터 복원 (첫 번째 연결만)
  await knex.raw(`
    UPDATE blocker SET linked_card_id = blc.card_id
    FROM (
      SELECT DISTINCT ON (blocker_id) blocker_id, card_id
      FROM blocker_linked_card
      ORDER BY blocker_id, position ASC
    ) blc
    WHERE blocker.id = blc.blocker_id
  `);

  // 3. 조인 테이블 삭제
  await knex.schema.dropTable('blocker_linked_card');
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 중복 연결 방지

*For any* 블로커와 카드 조합에 대해, 동일한 (blocker_id, card_id) 쌍으로 두 번째 연결을 생성하면 항상 409 Conflict가 반환되고 blocker_linked_card 테이블에 중복 레코드가 생성되지 않아야 한다.

**Validates: Requirements 1.2, 2.3**

### Property 2: CASCADE 삭제 무결성

*For any* 블로커 또는 카드가 삭제될 때, 해당 엔티티를 참조하는 모든 blocker_linked_card 레코드가 함께 삭제되어야 한다. 즉, 삭제 후 orphan 레코드가 존재하지 않아야 한다.

**Validates: Requirements 1.3, 1.4**

### Property 3: EDITOR 권한 필수

*For any* 카드 연결 생성 또는 삭제 요청에 대해, 요청자의 보드 멤버십 역할이 EDITOR인 경우에만 성공(200)하고, 그 외 역할(VIEWER, 비멤버)인 경우 항상 403 또는 404가 반환되어야 한다.

**Validates: Requirements 2.2, 2.4, 3.2, 3.3**

### Property 4: 연결 생성 정합성

*For any* 유효한 블로커와 아직 연결되지 않은 카드 조합에 대해, 연결 생성 API 호출 시 blocker_linked_card 테이블에 정확히 하나의 새 레코드가 생성되고, 반환된 데이터의 blockerId와 cardId가 요청 값과 일치해야 한다.

**Validates: Requirements 2.1**

### Property 5: 연결 삭제 정합성

*For any* 존재하는 blocker_linked_card 레코드에 대해, 삭제 API 호출 후 해당 레코드가 DB에 존재하지 않아야 하며, 동일 블로커의 다른 연결 레코드는 영향받지 않아야 한다.

**Validates: Requirements 3.1**

### Property 6: 자동 해결 조건

*For any* 활성 블로커에 N개(N ≥ 1)의 카드가 연결된 상태에서, 모든 연결 카드의 completedAt이 non-null이면 블로커의 status는 'resolved'로, resolvedAt은 non-null로 업데이트되어야 한다. 하나라도 completedAt이 null인 카드가 있으면 블로커는 'active' 상태를 유지해야 한다. 연결 카드가 0개인 블로커는 자동 해결 대상이 아니어야 한다.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: 카드 검색 필터링

*For any* 보드의 카드 목록, 블로커에 이미 연결된 카드 집합, 블로커가 속한 카드 ID에 대해, 검색 드롭다운에 표시되는 카드 목록에는 이미 연결된 카드와 블로커 소유 카드가 포함되지 않아야 한다.

**Validates: Requirements 5.2**

### Property 8: 연결 카드 정보 표시

*For any* 블로커에 연결된 카드에 대해, UI 렌더링 결과에는 해당 카드의 이름(name)과 완료 상태(completedAt 기반)가 반드시 표시되어야 한다.

**Validates: Requirements 5.4**

### Property 9: 데이터 마이그레이션 정합성

*For any* 기존 blocker 레코드에서 linked_card_id가 non-null인 경우, 마이그레이션 후 blocker_linked_card 테이블에 동일한 (blocker.id, blocker.linked_card_id) 매핑이 정확히 하나 존재해야 한다.

**Validates: Requirements 1.6**
