# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo with two npm workspaces driven by a thin root `package.json`:

- `server/` — Sails.js (Node.js) API + WebSocket gateway, PostgreSQL via Waterline ORM and Knex migrations
- `client/` — React + Redux + Redux-Saga + Redux-ORM SPA, built with Vite
- `.kiro/` — local product/architecture spec docs (`steering/`, `specs/`); not shipped
- `kanban-docs/`, `assets/`, `charts/` — docs site, marketing assets, Helm chart

There is no top-level lint/test target that introspects workspaces — root scripts shell out to each package via `npm run X --prefix server|client`.

## Commands (run from repo root unless noted)

### Dev loop
- `npm start` — runs server (`nodemon`) and client (`vite`) concurrently
- `npm run server:start` / `npm run client:start` — run one side only
- `docker-compose -f docker-compose-dev.yml up --build` — full dev stack (server + client + Postgres) when Postgres isn't installed locally. The dev image's `command` runs `npm install && npm run db:init && npm start` for the server container, so first boot is slow

### Build / lint / test
- `npm run lint` — runs both `server:lint` (ESLint, airbnb base + Prettier) and `client:lint`. **Server lint is `--max-warnings=0`** — warnings break the build
- `npm run test` — runs `server:test` (Mocha + Chai + Supertest, `test/lifecycle.test.js test/integration/**/*.test.js test/utils/**/*.test.js`) then `client:test` (Jest)
- Single server test: `npm test --prefix server -- test/integration/path/to.test.js`
- Single client test: `npm test --prefix client -- path/to.test.js` (Jest pattern)
- Client E2E (Cucumber + Playwright): `npm test:acceptance --prefix client`
- `npm run server:build` / `npm run client:build` — production bundles
- `npm run server:swagger:generate` — regenerate `swagger.json` for the public API spec

### Database
- `npm run server:db:init` — initialize a fresh DB (idempotent; run once after creating Postgres)
- `npm run server:db:migrate` — apply pending Knex migrations (`knex migrate:latest --cwd db`)
- `npm run server:db:seed` — run seeds
- `npm run server:db:upgrade` — Planka's combined migration+post-process upgrade flow
- `npm run server:db:create-admin-user` — provision an admin
- From `server/`: `npx knex migrate:rollback`, `npx knex migrate:status`

### Versioning
- `npm run gv` — regenerates `server/version.js` and `client/src/version.js` from root `package.json` via `genversion`. Run this after bumping the root version

## Environment

- Required env vars are read from `server/.env` (or container env). `BASE_URL`, `DATABASE_URL`, `SECRET_KEY` are mandatory; see `docker-compose-dev.yml` for the full annotated list
- The server `postinstall` runs `patch-package && setup-python.js` — Python venv at `server/.venv` is used by `apprise` for notifications. The dev Dockerfile pre-builds this venv and the compose file uses an anonymous volume to keep it out of the host bind mount
- DB column convention is `snake_case`; Waterline attributes are `camelCase`. `server/config/datastores.js` configures Knex's `wrapIdentifier` to translate automatically — do **not** add manual `columnName:` mappings unless the table name itself differs from the lowercased model name. Multi-word model files (e.g. `BlockerLinkedCard.js`) **must** declare `tableName: 'blocker_linked_card'` explicitly, since Waterline's default uses the lowercased model name without underscores

## Server Architecture (Sails.js)

Layered, with strict separation:

1. **`server/config/routes.js`** — explicit route → controller mapping (no blueprints). Add new endpoints here
2. **`server/api/policies/`** — auth/authz middleware (e.g. `is-authenticated`). Wired in `server/config/policies.js`
3. **`server/api/controllers/<resource>/<action>.js`** — thin: input schema (`inputs:`), exit types (`exits:`), permission checks, and a single helper call. Business logic does **not** belong here
4. **`server/api/helpers/<domain>/<action>.js`** — all business logic. Helpers can call other helpers (`sails.helpers.X.Y.with({...})`) and broadcast WebSocket events (`sails.sockets.broadcast(`board:${id}`, 'eventName', { item }, req)`)
5. **`server/api/models/<Model>.js`** — Waterline schema (attributes, associations). Constants like enum types (`Model.Types.X`) live here as static fields
6. **`server/api/hooks/query-methods/models/<Model>.js`** — every model has a sibling "query methods" file exposing `Model.qm.getByXxx`, `createOne`, `updateOne`, `deleteOne` etc. Controllers and helpers call these instead of using Waterline directly. **When adding a model, you must add both files.**
7. **`server/db/migrations/`** — Knex migrations. Filename: `YYYYMMDDHHMMSS_description.js`. **Never modify a committed migration; add a new one.** Knex sorts by filename — duplicate timestamps silently break the migration order

WebSocket events are the primary real-time channel. Every helper that mutates state should broadcast via `sails.sockets.broadcast(...)` after persisting. The client's socket handler in `client/src/sagas/core/watchers/socket.js` must have a matching listener.

## Client Architecture (React + Redux)

The state pipeline has more layers than typical Redux apps:

1. **Component** dispatches an `entry-action` (high-level intent, e.g. `entryActions.createBlocker(...)`)
2. **Saga watcher** (`client/src/sagas/core/watchers/<domain>.js`) listens for the entry action and calls the corresponding **service saga** (`client/src/sagas/core/services/<domain>.js`)
3. **Service saga** dispatches the `actions.X` lifecycle (`request → success/failure`), invokes `api/<domain>.js` (over `socket.io`), and on success dispatches `actions.X.success`
4. **Redux-ORM model** (`client/src/models/<Model>.js`) reduces the action via its static `reducer({ type, payload }, Model)`
5. **Selectors** (`client/src/selectors/<domain>.js`) read derived data via `createSelector` from `redux-orm`

When adding a new domain (`foo`), you usually need files in **all** of: `actions/foo.js`, `entry-actions/foo.js`, `api/foo.js`, `sagas/core/services/foo.js`, `sagas/core/watchers/foo.js`, `models/Foo.js`, `selectors/foo.js`, plus matching entries in each `index.js` (the registries are flat spreads — a missing entry silently makes the domain inert) and the model registered in `client/src/orm.js`. Constants belong in `client/src/constants/{ActionTypes,EntryActionTypes,Enums,Icons,Paths}.js`.

### Critical: page-refresh data loading

Page refresh does **not** trigger `BOARD_FETCH__SUCCESS`. It triggers `LOCATION_CHANGE_HANDLE` via `client/src/sagas/core/services/router.js`, which fetches the same board endpoint but produces a different action. Each new domain's model reducer must handle **both** action types, and the router saga must destructure the new fields from `getBoard`'s `included` and pass them to `actions.handleLocationChange(...)`. The action creator's argument list (in `client/src/actions/router.js`) must mirror the saga.

## Adding Features — Pattern Checklist

For a new domain `foo`:

- [ ] Knex migration with FKs and indexes (snake_case columns)
- [ ] `server/api/models/Foo.js` (+ `tableName` if multi-word) and `server/api/hooks/query-methods/models/Foo.js`
- [ ] Helpers under `server/api/helpers/foo/` containing `create-one.js`, `update-one.js`, `delete-one.js`, `get-path-to-project-by-id.js` (the last is needed by controllers for permission checks); each broadcasts WebSocket events
- [ ] Controllers under `server/api/controllers/foo/` with `inputs`, `exits`, membership/role checks
- [ ] Routes added in `server/config/routes.js`
- [ ] Server `boards/show.js` extended to include `foo` in the `included` payload (so initial board load + refresh both populate it)
- [ ] Client model in `client/src/models/Foo.js`, registered in `client/src/orm.js` and `client/src/models/index.js`. Reducer handles `LOCATION_CHANGE_HANDLE`, `CORE_INITIALIZE`, `BOARD_FETCH__SUCCESS`, `SOCKET_RECONNECT_HANDLE`, plus the domain's own create/update/delete actions and their `_HANDLE` (websocket) counterparts
- [ ] Client `actions/foo.js`, `entry-actions/foo.js`, `api/foo.js`, `sagas/core/services/foo.js`, `sagas/core/watchers/foo.js`, `selectors/foo.js`, all wired in their respective `index.js`
- [ ] `client/src/sagas/core/services/router.js` extended to destructure new fields from `api.getBoard`'s `included` and forward them through `actions.handleLocationChange`
- [ ] `client/src/actions/router.js` `handleLocationChange` argument list extended to match
- [ ] WebSocket socket handlers added to `client/src/sagas/core/watchers/socket.js` for `fooCreate` / `fooUpdate` / `fooDelete`

## Conventions to Match

- **Immutable updates everywhere.** Never mutate Redux state, never call `array.push`, always spread
- **File names:** server controllers/helpers use `kebab-case.js`; models and React components use `PascalCase.{js,jsx}`; React style modules are `*.module.scss`
- **API response envelope:** `{ item: ... }` for single, `{ items: [...] }` for lists, `{ item, included: { ... } }` when including related records
- **Commit message format:** `<type>: <description>` where type ∈ {feat, fix, refactor, docs, test, chore, perf, ci}
- **Husky + lint-staged** runs ESLint on staged JS/JSX before commit. Don't bypass with `--no-verify`

## Things That Surprise New Contributors

- Two parallel registries exist for each model: the Waterline model (`server/api/models/`) **and** the query-methods file (`server/api/hooks/query-methods/models/`). Adding only one and forgetting the other produces runtime errors only when that code path is exercised
- The `boards/show` endpoint is the canonical "load everything for a board" call; both the initial mount saga and the page-refresh router saga rely on it. Any new domain must be added there, otherwise the data won't survive a refresh even if WebSocket updates work
- The dev Docker setup uses anonymous volumes to keep host `node_modules` and `server/.venv` from leaking into the Linux Alpine container. The container runs `npm install` on first start; deleting these volumes (e.g. `docker compose down -v`) forces a reinstall
- `server/.env`'s `DATABASE_URL` controls Knex too — the migration commands use it
