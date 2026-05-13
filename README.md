# Planka-Kanbanize

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)
![Sails.js](https://img.shields.io/badge/Sails.js-1.5-14ACC2.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)
![Node.js](https://img.shields.io/badge/Node.js-22-339933.svg)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/teinam)
## 개요

Planka-Kanbanize는 [Planka](https://github.com/plankanban/planka) 기반의 칸반 프로젝트 관리 도구로, 칸반 시스템 이론(WIP 제한, 풀 시스템, 커밋먼트 포인트, 플로우 메트릭스)을 실무에 적용할 수 있도록 확장한 포크입니다. 실시간 협업, 드래그앤드롭 보드, 블로커 관리, 스윔레인 등을 지원합니다.

## 주요 기능

### 칸반 시스템 (Kanbanize 확장)

- **WIP 제한 (Work In Progress Limit):** 리스트별/보드 전체 WIP 제한 설정 및 초과 경고
- **커밋먼트 포인트 (Commitment Point):** 보드 내 커밋먼트/딜리버리 포인트 설정, 카드 통과 시 자동 기록
- **스윔레인 (Swim Lane):** 보드를 수평으로 분할하여 작업 유형별 시각적 구분
- **Class of Service:** 카드에 서비스 등급(Standard, Fixed Date, Expedite, Intangible) 부여
- **블로커 (Blocker):** 카드에 차단 사유 등록, 다수 카드 연결, 연결 카드 전체 완료 시 자동 해결
- **플로우 메트릭스:** CFD(누적 흐름 다이어그램), 리드타임 히스토그램, 처리량 런차트, WIP 에이징 차트

### 기본 기능 (Planka 원본)

- **실시간 협업:** WebSocket 기반 즉시 동기화
- **드래그앤드롭:** 카드, 리스트, 태스크 자유 이동
- **마크다운 에디터:** 카드 설명에 풍부한 서식 지원
- **다국어 지원:** 30+ 언어 국제화
- **SSO 인증:** OpenID Connect 통합
- **알림:** 100+ 채널 지원 (Apprise)
- **파일 첨부:** 로컬 스토리지 또는 S3 호환 스토리지
## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18, Redux + Redux-Saga + Redux-ORM, Vite 7, Semantic UI React |
| 백엔드 | Node.js 22, Sails.js 1.5, Knex 3 (쿼리 빌더/마이그레이션) |
| 데이터베이스 | PostgreSQL 16 |
| 실시간 통신 | WebSocket (socket.io) |
| 인증 | JWT, OpenID Connect (SSO) |
| 알림 | Apprise (100+ 채널) |
| 스토리지 | 로컬 파일시스템 또는 S3 호환 |
| 컨테이너 | Docker (멀티스테이지 빌드), Docker Compose |
| 배포 | Helm Chart (Kubernetes) |
| 테스트 | Mocha + Chai + Supertest (서버), Jest (클라이언트), Playwright + Cucumber (E2E) |

## 빠른 시작 (Docker)

### 사전 요구사항

- Docker 및 Docker Compose 설치
- Git

### 개발 환경 실행

```bash
# 저장소 클론
git clone https://github.com/TeiNam/planka-kanbanize.git
cd planka-kanbanize

# Docker 이미지 빌드 및 실행
docker-compose -f docker-compose-dev.yml build
docker-compose -f docker-compose-dev.yml up
```

서버: http://localhost:1337
클라이언트: http://localhost:3000

초기 관리자 계정은 서버 시작 시 자동 생성됩니다. 환경변수로 설정 가능:

```bash
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=your-password
DEFAULT_ADMIN_NAME=Admin
DEFAULT_ADMIN_USERNAME=admin
```
## 프로덕션 배포 (Docker)

### Docker Compose로 배포

`docker-compose.yml` 파일을 생성합니다:

```yaml
services:
  planka:
    image: ghcr.io/teinam/planka-kanbanize:latest
    restart: unless-stopped
    volumes:
      - app-data:/app/data
    ports:
      - "1337:1337"
    environment:
      - BASE_URL=https://your-domain.com
      - DATABASE_URL=postgresql://postgres:your-db-password@postgres/planka
      - SECRET_KEY=your-secret-key-min-32-chars
      - DEFAULT_ADMIN_EMAIL=admin@your-domain.com
      - DEFAULT_ADMIN_PASSWORD=your-admin-password
      - DEFAULT_ADMIN_NAME=Admin
      - DEFAULT_ADMIN_USERNAME=admin
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=planka
      - POSTGRES_PASSWORD=your-db-password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d planka"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  app-data:
  db-data:
```

실행:

```bash
docker-compose up -d
```

접속: http://your-domain.com:1337

### 주요 참고사항

- 첫 실행 시 DB 스키마가 자동으로 생성됩니다 (마이그레이션 자동 실행)
- `SECRET_KEY`는 반드시 안전한 랜덤 문자열로 설정하세요
- 업데이트 시 이미지를 pull하고 재시작하면 새 마이그레이션이 자동 적용됩니다
- 데이터는 `app-data` (첨부파일)와 `db-data` (PostgreSQL) 볼륨에 저장됩니다

### 특정 버전 사용

```bash
# 최신 버전
image: ghcr.io/teinam/planka-kanbanize:latest

# 특정 버전
image: ghcr.io/teinam/planka-kanbanize:1.0.0
```

## 로컬 개발 (Docker 없이)

### 사전 요구사항

- Node.js >= 20
- PostgreSQL 16
- Python 3 (Apprise 알림용)

### 서버 설정

```bash
cd server
cp .env.sample .env
# .env 파일에서 DATABASE_URL, SECRET_KEY 등 설정

npm install
npm run db:init    # DB 마이그레이션 실행
npm start          # nodemon으로 개발 서버 시작 (포트 1337)
```

### 클라이언트 설정

```bash
cd client
npm install
npm start          # Vite 개발 서버 시작 (포트 3000)
```

## 환경변수 설정

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `BASE_URL` | 서비스 접근 URL | - |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | - |
| `SECRET_KEY` | JWT 서명 키 | - |
| `DEFAULT_LANGUAGE` | 기본 언어 | `en-US` |
| `TOKEN_EXPIRES_IN` | 토큰 만료 (일) | `365` |
| `MAX_UPLOAD_FILE_SIZE` | 최대 업로드 크기 | - |
| `TRUST_PROXY` | 리버스 프록시 사용 시 | `false` |
| `SMTP_HOST` | 이메일 SMTP 호스트 | - |
| `SMTP_PORT` | SMTP 포트 | `587` |
| `S3_ENDPOINT` | S3 호환 스토리지 엔드포인트 | - |
| `OIDC_ISSUER` | OpenID Connect 발급자 URL | - |

전체 환경변수 목록은 `docker-compose-dev.yml`을 참고하세요.

## 프로젝트 구조

```
planka-kanbanize/
├── client/                  # React 프론트엔드
│   ├── src/
│   │   ├── actions/         # Redux 액션 크리에이터
│   │   ├── api/             # API 클라이언트 함수
│   │   ├── components/      # React 컴포넌트
│   │   ├── constants/       # 상수 (ActionTypes, Enums)
│   │   ├── entry-actions/   # 엔트리 액션 (UI → Saga)
│   │   ├── models/          # Redux-ORM 모델
│   │   ├── sagas/           # Redux-Saga (비동기 로직)
│   │   └── selectors/       # Reselect 셀렉터
│   └── package.json
├── server/                  # Sails.js 백엔드
│   ├── api/
│   │   ├── controllers/     # API 컨트롤러
│   │   ├── helpers/         # 비즈니스 로직 헬퍼
│   │   ├── hooks/           # Sails 훅 (query-methods)
│   │   ├── models/          # Waterline 모델
│   │   └── policies/        # 인증/인가 미들웨어
│   ├── config/              # Sails 설정
│   ├── db/
│   │   ├── migrations/      # Knex 마이그레이션
│   │   └── seeds/           # 시드 데이터
│   └── package.json
├── charts/                  # Helm Chart (Kubernetes)
├── docker-compose-dev.yml   # 개발 환경 Docker Compose
├── Dockerfile               # 프로덕션 멀티스테이지 빌드
└── Dockerfile.dev           # 개발 환경 이미지
```

## 테스트

```bash
# 서버 통합 테스트 (Mocha + Supertest)
cd server && npm test

# 클라이언트 단위 테스트 (Jest)
cd client && npm test

# E2E 테스트 (Cucumber + Playwright)
cd client && npm run test:acceptance

# 린트
cd server && npm run lint
cd client && npm run lint
```

## 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feat/my-feature`)
3. 변경사항을 커밋합니다 (`git commit -m "feat: add my feature"`)
4. 브랜치에 푸시합니다 (`git push origin feat/my-feature`)
5. Pull Request를 생성합니다

커밋 메시지 형식: `<type>: <description>` (feat, fix, refactor, docs, test, chore)

## 라이선스

이 프로젝트는 [Planka](https://github.com/plankanban/planka)를 포크하여 개발되었으며, 원본 프로젝트의 라이선스를 따릅니다.

- 원본: [PLANKA Community License (Fair Use License)](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20Community%20License%20EN.md)
- 상업용: [PLANKA Commercial License](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20Commercial%20License%20EN.md)
- 가이드: [PLANKA License Guide](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20License%20Guide%20EN.md)

## 감사의 말

- [Planka](https://github.com/plankanban/planka) — 원본 프로젝트
- [PLANKA Software GmbH](https://planka.cloud) — 원본 개발사
