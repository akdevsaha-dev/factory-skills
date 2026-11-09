---
name: init-database
description: Set up PostgreSQL or Supabase in an existing backend without creating any tables, including connection management, configuration, migration tooling with native Supabase SQL, Drizzle, Prisma, Alembic, or goose, a readiness check, and local development. Use when the user asks to initialize, set up, add, or configure a database or migrations.
---

# Initialize Database

You are a senior backend engineer responsible for adding a safe, maintainable database layer to an existing backend.

## Scope

This skill sets up the database. It does not design the schema.

It creates:

- The connection pool or client, with lifecycle management
- Database configuration and `.env.example` entries
- The chosen migration tool, configured, with an empty migrations directory
- A database readiness check
- Local development setup
- A connectivity test

It does not create:

- Tables, columns, indexes, policies, triggers, or functions
- Migration files
- ORM models or schema definitions for tables
- Repositories or query functions for tables
- Seed data

Create any of these only when the user explicitly asks for them in the same request. Do not offer a sample `users` table. The user writes the first migration when they are ready.

This skill does not create a backend. If no backend exists, tell the user to run `npx skills add akdevsaha-dev/factory-skills --skill init-backend` first, or offer to do so before continuing.

## Step 1: Inspect the project

Before making changes:

1. Locate the backend. Prefer `backend/`, then any directory containing `package.json`, `pyproject.toml`, or `go.mod` with an HTTP server.
2. Detect the stack from its files:
   - `package.json` with TypeScript → Node.js
   - `pyproject.toml` with FastAPI → Python
   - `go.mod` → Go
3. Check for an existing database layer: `src/db/`, `internal/db/`, `drizzle/`, `drizzle.config.ts`, `prisma/schema.prisma`, `alembic/`, `migrations/`, `supabase/migrations/`, or a `DATABASE_URL` in `.env.example`.
4. Never overwrite existing code without explicit approval.
5. If a database layer already exists, ask whether to extend it or stop.

## Step 2: Choose the database

If the user has not specified a provider, ask:

"Which database would you like to set up?"

Options:

1. PostgreSQL (self-hosted, Docker, Neon, RDS, or any plain Postgres)
2. Supabase (hosted Postgres with Auth, Storage, and the Supabase client)

Do not ask again if the user's request already specifies the provider.

Infer the provider from existing project files when possible: a `supabase/` directory, `SUPABASE_URL` in `.env.example`, or a Supabase SDK dependency means Supabase.

Supabase is still PostgreSQL. Schema, migrations, and SQL conventions in this skill apply to both. The difference is how the application connects and which tooling owns migrations.

## Step 3: Choose the migration tool

Exactly one tool owns the schema. Running two migration tools against the same database causes drift.

Available tools depend on the stack and provider:

| Tool | Migrations live in | Stacks | Providers |
| --- | --- | --- | --- |
| Native Supabase migrations | `supabase/migrations/<timestamp>_<name>.sql` | Node.js, Python, Go | Supabase only |
| Drizzle | `drizzle/` | Node.js only | PostgreSQL, Supabase |
| Prisma | `prisma/migrations/` | Node.js only | PostgreSQL, Supabase |
| Alembic | `alembic/versions/` | Python only | PostgreSQL, Supabase |
| goose | `migrations/` | Go only | PostgreSQL, Supabase |

If the user has not specified a tool, ask:

"Which tool should own your database migrations?"

Show only the options valid for the detected stack and provider, with the recommended one first:

- Supabase, any stack: Native Supabase migrations (recommended), then the stack's tools
- Node.js + PostgreSQL: Drizzle (recommended), Prisma
- Python + PostgreSQL: Alembic
- Go + PostgreSQL: goose

When only one option is valid, use it and state the choice instead of asking.

Do not ask again if the user's request already names a tool.

Infer the tool from existing files before asking:

- `supabase/migrations/*.sql` present → native Supabase migrations
- `prisma/schema.prisma` → Prisma
- `drizzle.config.ts` → Drizzle
- `alembic.ini` → Alembic
- `.sql` files with `-- +goose Up` → goose

If the user asks for Drizzle or Prisma on a Python or Go backend, explain that they are Node.js tools and offer native Supabase migrations or the stack's own tool instead.

The migration tool and the query library are separate decisions. With native Supabase migrations the application still needs a way to query: plain driver SQL, a query-only ORM, or the Supabase SDK. The stack and Supabase references cover this.

## Step 4: Determine the location

All database code goes inside the existing backend directory, following that stack's established layout. Never create a top-level `database/` folder at the repository root.

Per stack, for application code:

- Node.js: `src/db/` for the client
- Python: `src/db/` for the engine, session, and declarative base
- Go: `internal/db/` for the pool and queries

Per migration tool, for schema files:

- Native Supabase: `supabase/` inside the backend directory, with `config.toml`, `migrations/`, and `seed.sql`
- Drizzle: `src/db/schema/index.ts` with no tables, `drizzle/`, and `drizzle.config.ts`
- Prisma: `prisma/schema.prisma` with no models, and `prisma.config.ts` when the Prisma version uses it
- Alembic: `alembic/` and `alembic.ini`
- goose: `migrations/`

## Step 5: Read the relevant instructions

Read, in order:

1. The stack reference:
   - Node.js: `references/postgres-node.md`
   - Python: `references/postgres-python.md`
   - Go: `references/postgres-go.md`
2. The provider reference, if Supabase was selected: `references/supabase.md`
3. The migration tool reference:
   - Native Supabase migrations: `references/supabase-migrations.md`
   - Drizzle: `references/drizzle.md`
   - Prisma: `references/prisma.md`
   - Alembic and goose: covered inside the Python and Go stack references

When the migration tool reference conflicts with the stack reference on schema or migration details, the migration tool reference wins.

Read the selected references before generating files.

## Step 6: Generate the database layer

Create, at minimum:

- Connection: a single pool or engine, created once, configured from the environment, closed on shutdown
- Configuration: `DATABASE_URL` added to the existing settings module and `.env.example`
- Migrations: the chosen tool configured, with an empty migrations directory and its commands wired into the project scripts or README
- Health: extend the existing health check with a database readiness check, or add `GET /health/ready`, without breaking the existing `GET /health`
- Tests: a connectivity test that runs `select 1` against a real database when one is available and skips cleanly when it is not
- Local development: a `docker-compose.yml` with a Postgres service for plain PostgreSQL, or Supabase CLI local setup for Supabase

Do not create empty files to satisfy a directory structure.

## Step 7: Schema conventions

Do not create tables. Document these conventions in the backend README so the first migration the user writes follows them:

- Use `snake_case` for tables and columns.
- Use plural table names.
- Use `timestamptz`, never `timestamp`.
- Use `uuid` or `bigint identity` primary keys, never `serial`.
- Add `not null` by default and relax it deliberately.
- Add foreign keys with explicit `on delete` behavior.
- Add indexes for every foreign key and every column used in a `where` clause.
- Put constraints in the database, not only in application code.

## Step 8: Migrations

- Every schema change is a migration. Never alter the database by hand or with an ORM `create_all` outside tests.
- Migrations must be committed to the repository.
- Generated migrations must be reviewed before being accepted. Do not trust auto-generated diffs blindly.
- Migrations run explicitly through a project script, not automatically on application startup, unless the user asks for startup migrations and understands the tradeoff.
- Prefer additive, backwards-compatible changes. Split destructive changes into separate migrations.

## Step 9: Install dependencies

Use the stack's package manager from inside the backend directory:

- Node.js: npm
- Python: uv
- Go: go modules

Use compatible stable versions. Update lock files.

## Step 10: Verify

Run all relevant checks:

1. Dependency installation
2. Formatting, linting, and type checking as the backend already defines them
3. Start a local database with Docker Compose or the Supabase CLI, if Docker is available
4. Confirm the migration tool connects and reports an empty history:
   - Native Supabase: `supabase migration list`
   - Drizzle: `drizzle-kit check`
   - Prisma: `prisma validate`, then `prisma migrate status`
   - Alembic: `alembic current`
   - goose: `goose status`
5. Confirm no tables were created in the `public` schema
6. Run automated tests
7. Start the application and request the health endpoint
8. Confirm the readiness check reports the database as reachable

If Docker or network access is unavailable, run everything that does not need a live database and report exactly which steps were skipped.

Do not claim a command passed unless it actually ran successfully.

## Step 11: Completion report

Report:

- Selected provider, stack, and migration tool
- Files created and modified, confirming no tables or migration files were created
- Installed dependencies
- Environment variables added
- Commands to start the local database, create the first migration, apply migrations, and run tests
- Tests and checks executed
- Steps that could not be verified and why

## Engineering principles

- One connection pool per process, created once, closed on shutdown.
- Never create database clients at module import time when that complicates startup or testing.
- Never log connection strings, passwords, or service role keys.
- Never commit `.env`. Always update `.env.example`.
- Use parameterized queries only. Never interpolate values into SQL.
- Keep SQL and query code out of HTTP handlers and services. Repositories talk to the database.
- Use transactions for multi-statement writes.
- Use the least privileged credential the application needs.
- Set statement and connection timeouts.
- Preserve existing repository conventions.
- Never describe a schema as production-ready without verification.
