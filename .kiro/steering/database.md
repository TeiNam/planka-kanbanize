# Database Rules (Planka — PostgreSQL + Knex)

## Migration Rules

### 마이그레이션 생성
- 스키마 변경은 반드시 Knex 마이그레이션으로 관리
- 파일명: `YYYYMMDDHHMMSS_description.js`
- 위치: `server/db/migrations/`
- 항상 `up`과 `down` 모두 구현 (롤백 가능하도록)

### 마이그레이션 실행
```bash
# 마이그레이션 실행 (cwd: ~/dev/planka/server)
npx knex migrate:latest

# 롤백
npx knex migrate:rollback

# 상태 확인
npx knex migrate:status
```

### 마이그레이션 Best Practices
- 한번 커밋된 마이그레이션은 수정하지 않음
- 데이터 손실 가능한 변경은 별도 마이그레이션으로 분리
- 대용량 테이블 변경 시 다운타임 고려
- 인덱스 추가는 `CREATE INDEX CONCURRENTLY` 고려

## Naming Conventions (snake_case)

Knex 마이그레이션에서는 snake_case 사용:
- 테이블명: `snake_case` (복수형: `board_memberships`)
- 컬럼명: `snake_case` (예: `created_at`, `board_id`)
- 인덱스명: `idx_[table]_[columns]`
- FK명: `fk_[table]_[ref_table]`

참고: Planka는 `knexfile.js`에서 `wrapIdentifier`로 camelCase → snake_case 자동 변환

## Waterline Model Rules

- 모델 파일: `server/api/models/PascalCase.js`
- 속성명: camelCase (ORM 레벨)
- 관계 정의: `model`, `collection`, `via` 사용
- `tableName` 속성으로 실제 테이블명 매핑

## Query Patterns

### 안전한 쿼리 (Parameterized)
```javascript
// Knex — 항상 parameterized
const cards = await knex('card')
  .where({ board_id: boardId })
  .orderBy('position');

// Waterline — ORM이 자동 파라미터화
const cards = await Card.find({ boardId });
```

### 금지 패턴
```javascript
// NEVER — SQL injection 위험
const cards = await knex.raw(`SELECT * FROM card WHERE board_id = '${boardId}'`);
```

## Index Strategy

- 외래 키 컬럼에 인덱스 필수
- 자주 검색되는 컬럼에 인덱스 추가
- 복합 인덱스: 선택도 높은 컬럼을 앞에 배치
- 부분 인덱스 활용 (WHERE 조건 포함)

## Data Integrity

- NOT NULL 제약 적극 활용
- 외래 키 제약 + ON DELETE CASCADE/SET NULL 설정
- CHECK 제약으로 비즈니스 규칙 강제
- UUID를 기본 키로 사용 (uuid_generate_v4())
