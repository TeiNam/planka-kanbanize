# Git Workflow Rules (Planka)

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## PR Workflow

When creating a PR:
1. Analyze the full commit history (not just the latest commit)
2. Review all changes with `git diff [base-branch]...HEAD`
3. Write a comprehensive PR summary
4. Include a test plan with TODOs
5. Push with `-u` flag for new branches

## Branch Naming

- `feat/short-description` — 새 기능
- `fix/short-description` — 버그 수정
- `refactor/short-description` — 리팩토링
- `docs/short-description` — 문서 변경
- `test/short-description` — 테스트 추가/수정

## Planka-Specific Git Rules

- 마이그레이션 파일은 한번 커밋되면 수정하지 않음 (새 마이그레이션 생성)
- `docker-compose.yml` 변경 시 PR 설명에 명시
- `.env.sample` 변경 시 README 업데이트 포함
- Husky pre-commit 훅이 lint-staged 실행 (ESLint + Prettier)
