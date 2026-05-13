# Security Rules (Planka)

## Required Security Checks (Verify Before Every Commit)

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user input validated and sanitized
- [ ] SQL injection prevention (Knex parameterized queries only)
- [ ] XSS prevention (React 자동 이스케이프 + 수동 입력 검증)
- [ ] CSRF protection (httpOnly 쿠키 + SameSite)
- [ ] Authentication/authorization verified (JWT + policies)
- [ ] Rate limiting on all endpoints
- [ ] Error handling on critical paths
- [ ] No sensitive data exposed in error messages
- [ ] WebSocket 메시지 인증 확인

## Secret Management

- Never hardcode secrets in source code
- Always use environment variables (process.env)
- Validate required secrets exist at startup
- `.env` 파일은 `.gitignore`에 포함
- Docker secrets 또는 환경변수로 프로덕션 배포

## Planka-Specific Security

### 인증 (Authentication)
- JWT 토큰은 httpOnly 쿠키로 전달 (XSS 방어)
- 비밀번호는 반드시 bcrypt 해싱 (cost factor >= 10)
- API Key는 해시 저장, 평문 노출 금지
- OIDC SSO 설정 시 redirect_uri 화이트리스트 검증

### 인가 (Authorization)
- 모든 라우트에 `is-authenticated` 정책 적용 확인
- 리소스 접근 시 소유권/멤버십 검증 필수
- 관리자 전용 라우트에 `is-admin` 정책 적용
- 프로젝트/보드 멤버십 기반 접근 제어

### 데이터베이스
- Knex parameterized queries만 사용 (문자열 연결 금지)
- Waterline ORM 쿼리 사용 시 입력 검증 선행
- 마이그레이션에서 민감 데이터 컬럼 암호화 고려

### WebSocket
- WebSocket 연결 시 JWT 토큰 검증
- 보드 구독 시 멤버십 확인
- 브로드캐스트 시 수신자 권한 확인

## Code Patterns to Flag Immediately

| Pattern | Severity | Fix |
|---------|----------|-----|
| Hardcoded secrets | CRITICAL | `process.env` 사용 |
| Shell command with user input | CRITICAL | 안전한 API 또는 execFile 사용 |
| String-concatenated SQL/Knex | CRITICAL | Parameterized queries 사용 |
| `innerHTML = userInput` | HIGH | React JSX 또는 DOMPurify 사용 |
| `fetch(userProvidedUrl)` | HIGH | 허용 도메인 화이트리스트 |
| Plaintext password comparison | CRITICAL | `bcrypt.compare()` 사용 |
| No auth check on route | CRITICAL | 정책(policy) 미들웨어 추가 |
| No membership check | HIGH | 리소스 접근 전 멤버십 검증 |
| No rate limiting | HIGH | express-rate-limit 등 추가 |
| Logging passwords/secrets | MEDIUM | 로그 출력 정제 |
| WebSocket without auth | CRITICAL | 연결 시 토큰 검증 |

## OWASP Top 10 for Planka

1. **Injection** — Knex parameterized queries 사용, 사용자 입력 정제
2. **Broken Authentication** — bcrypt 해싱, JWT 만료 설정, 세션 관리
3. **Sensitive Data Exposure** — HTTPS 강제, 환경변수로 시크릿 관리
4. **XXE** — JSON 파서만 사용 (XML 비활성화)
5. **Broken Access Control** — Sails policies + 멤버십 검증
6. **Security Misconfiguration** — 프로덕션에서 디버그 비활성화, 보안 헤더 설정
7. **XSS** — React 자동 이스케이프 + CSP 헤더
8. **Insecure Deserialization** — JSON 입력 스키마 검증
9. **Known Vulnerabilities** — `npm audit` 정기 실행
10. **Insufficient Logging** — Winston으로 보안 이벤트 로깅

## Core Security Principles

1. **Defense in Depth** — 다중 보안 레이어 (정책 + 헬퍼 검증 + DB 제약)
2. **Least Privilege** — 최소 권한만 부여
3. **Fail Securely** — 에러가 데이터를 노출하지 않도록
4. **Distrust Input** — 모든 외부 입력 검증 및 정제
5. **Regular Updates** — 의존성 최신 유지 (`npm audit fix`)
