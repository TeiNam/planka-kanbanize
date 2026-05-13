# Performance Optimization Rules (Planka)

## Optimize Only When Needed

- Cache expensive operations (Redis 또는 인메모리 캐시)
- PostgreSQL 인덱스 추가 for slow queries
- React 컴포넌트 메모이제이션 (React.memo, useMemo, useCallback)
- Redux 셀렉터 메모이제이션 (Reselect)
- WebSocket 메시지 배치 처리

## Planka-Specific Performance Considerations

### 데이터베이스
- N+1 쿼리 방지 — Waterline populate 또는 Knex JOIN 활용
- 대량 카드 조회 시 페이지네이션 적용
- 자주 조회되는 컬럼에 인덱스 추가
- 보드별 카드 수가 많을 때 lazy loading 고려

### 프론트엔드
- 대형 보드에서 가상 스크롤링 고려
- 이미지 첨부파일 lazy loading
- Redux 상태 정규화 (Redux-ORM 활용)
- 불필요한 리렌더링 방지 (셀렉터 메모이제이션)

### WebSocket
- 불필요한 브로드캐스트 최소화
- 보드 구독 범위 제한 (현재 보드만)
- 대량 업데이트 시 배치 메시지 사용

## Build Troubleshooting

When a build fails:
1. Analyze the error message
2. Fix incrementally
3. Verify after each fix
4. `npm run lint` 로 린트 에러 확인
5. `npm run server:test` / `npm run client:test` 로 테스트 확인

## Approach for Complex Tasks

When deep reasoning is needed for complex work:
1. Use a structured approach
2. Thorough analysis through multiple critique rounds
3. Review from diverse perspectives
4. Planka 기존 코드 패턴 참조
