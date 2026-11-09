# PostgreSQL for Node.js Backends

Applies to the Node.js + TypeScript + Express backend produced by `init-backend`.

This file covers what every Node.js database setup shares. The schema, client, and migration details come from the migration tool reference chosen in `SKILL.md` Step 3:

- Drizzle: `drizzle.md`
- Prisma: `prisma.md`
- Native Supabase migrations: `supabase-migrations.md`

## Stack

- PostgreSQL 16+
- Zod for environment validation, already present
- Vitest for tests, already present
- The query library chosen below

## Query library

The migration tool decides the query library:

- Drizzle migrations → Drizzle ORM with `postgres` (postgres.js)
- Prisma migrations → Prisma Client
- Native Supabase migrations → one of the following, asked only if the user has no preference:
  1. Drizzle ORM as a query-only layer, with the schema introspected by `drizzle-kit pull` (recommended for typed queries)
  2. `postgres` (postgres.js) with plain SQL and hand-written types
  3. `@supabase/supabase-js` with the service role key and generated types, when the backend also needs Supabase Auth, Storage, or Realtime

With native Supabase migrations, never run `drizzle-kit generate`, `drizzle-kit migrate`, `drizzle-kit push`, or `prisma migrate`. The SQL files in `supabase/migrations/` are the only source of schema truth.

## Project structure

All paths below are relative to the backend directory. Add to the existing layout; do not restructure it.

```text
backend/
├── src/
│   ├── config/
│   │   └── env.ts              # add DATABASE_URL
│   ├── db/
│   │   └── client.ts           # single client + close()
│   └── ...
├── tests/
│   └── db/
│       └── connection.test.ts
├── <migration tool files, see the tool reference>
└── .env.example                # add DATABASE_URL
```

## Configuration

Extend the existing Zod environment schema in `src/config/env.ts`:

- `DATABASE_URL`: `z.string().url()`, required
- `DATABASE_POOL_MAX`: coerced number, default 10

Add to `.env.example`:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app
```

## Client lifecycle

`src/db/client.ts`:

- Create exactly one client or pool for the process.
- Export it and an async `closeDb()`.
- Call `closeDb()` from the existing SIGINT and SIGTERM handlers in `server.ts`.
- Do not connect at import time in a way that breaks importing `app.ts` in tests. postgres.js and Prisma Client both connect lazily, which is sufficient.

## Repositories

Do not create repositories now. There are no tables yet.

Document this convention in the README for later: when a table is added, its queries go in `src/db/repositories/<table>.repository.ts`. Services call repositories. Handlers never import the database client directly.

## Readiness check

Add `GET /health/ready` through the existing routes → handler → service chain:

- The service runs `select 1` through the query library.
- Return `200 { "status": "ok", "database": "ok" }` on success.
- Return `503 { "status": "degraded", "database": "unreachable" }` on failure. Do not include the error message in the response.

Leave `GET /health` unchanged and database-free.

## Local development

For plain PostgreSQL, add `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  postgres_data:
```

For Supabase, do not add this file. The Supabase CLI owns the local stack.

## Tests

- `tests/db/connection.test.ts` runs `select 1` against the real database from `DATABASE_URL`.
- If `DATABASE_URL` is unset or the connection fails, skip the suite with `describe.skipIf` and a clear message, rather than failing.
- Existing health tests must not require a database.

## Verification

```bash
npm install
<start the local database>
<confirm the migration tool reports an empty history>
npm run typecheck
npm run lint
npm test
npm run dev   # then request http://localhost:8080/health/ready
```

Confirm the readiness endpoint returns 200 with the database up and 503 with it stopped.
