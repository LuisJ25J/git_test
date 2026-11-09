# AGENTS.md — Express music API

## Stack
- Node.js + Express 5 (port 3000) + PostgreSQL via `pg`
- Package manager: **pnpm** (lockfile: `pnpm-lock.yaml`). Do not use npm.
- Entry point: `clase1.js` (not `index.js` despite package.json `main`).

## Commands
```bash
pnpm install          # install deps
node clase1.js        # start server → http://localhost:3000
```
No test, lint, or typecheck scripts are defined in package.json.

## Environment
- `.env` is required (not committed). Must define: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`.
- PostgreSQL must be running as a Windows service before starting Express. If it is not, `node clase1.js` fails on connection.
- Database `musica_db` and tables (`genres`, `albums`) are created automatically on first run by `initializeDatabase()`, including seed data if tables are empty.

## Architecture
- Single file: `clase1.js` contains all routes and DB logic.
- Routes: `/api/genres` and `/api/albums` (CRUD: GET, GET/:id, POST, PUT/:id, DELETE/:id).
- `albums.genre_id` → FK to `genres.id` with `ON DELETE CASCADE`.
- Credentials come from `process.env` loaded via `dotenv` (`require('dotenv').config()` at top).

## Gotchas
- Do not commit `.env` (contains DB password).
- Port defaults to 3000 but is overridable via `PORT` env var.
- Seed data only inserts if `genres` table is empty; re-running won't duplicate.
- `adminPool` connects to the default `postgres` DB to create `musica_db`; `pool` connects to `musica_db` for app queries.
