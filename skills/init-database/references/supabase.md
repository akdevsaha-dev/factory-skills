# Supabase

Read the matching stack reference first. This file replaces its connection, migration, and local-development sections. Everything else in the stack reference still applies.

Supabase is hosted PostgreSQL. Every schema convention in `SKILL.md` applies unchanged. Like the rest of this skill, this file sets up Supabase and creates no tables.

## Choose the access pattern

Ask, unless the user already said:

"How should the backend talk to Supabase?"

1. Direct PostgreSQL connection. The backend uses the stack's normal driver and ORM against the Supabase connection string. Use this when the backend owns all data access and you want the stack reference's repository layer as written.
2. Supabase client SDK. The backend uses `@supabase/supabase-js`, `supabase-py`, or `supabase-go` with the service role key. Use this when the project also needs Supabase Auth, Storage, or Realtime from the server.

Both are valid. Do not mix them for the same table without a reason.

With a direct connection, keep the stack reference's repository layer and swap only the URL, migrations, and local setup described below.

With the SDK, the repository layer wraps the SDK client instead of the ORM. Keep the same function names and keep services unaware of which one is underneath.

## Connection strings

Supabase exposes several URLs. Use the right one:

- Migrations and local tooling: the direct connection on port 5432.
- Application runtime, especially serverless or many short-lived connections: the Supavisor transaction pooler on port 6543. Disable prepared statements when using it. For asyncpg set `statement_cache_size=0`; for postgres.js set `prepare: false`; for pgx use `default_query_exec_mode=simple_protocol` in the URL.

Add to `.env.example`:

```text
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# Direct connection, used by migrations
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
# Pooled connection, used by the application
DATABASE_POOL_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Adjust the scheme to the stack driver, for example `postgresql+asyncpg://`.

Only add the SDK keys when the SDK path is chosen.

## Key handling

- The service role key bypasses Row Level Security. It belongs only in server-side environment variables. Never ship it to a browser, mobile app, or public repository.
- The anon key is safe to expose to clients but is not needed by a pure backend. Omit it unless the server performs user-scoped operations.
- Never log any key or connection string.

## Supabase CLI

Install the CLI and initialize inside the backend directory:

```bash
npx supabase init
```

This creates `supabase/config.toml` and `supabase/migrations/`.

For local development:

```bash
npx supabase start     # starts Postgres, Auth, Studio, and the API in Docker
npx supabase status    # prints local URLs and keys
npx supabase stop
```

Use the local connection string from `supabase status` in `.env` during development. Do not write a separate `docker-compose.yml` for Postgres. The CLI owns the local stack.

Link to a hosted project when the user has one:

```bash
npx supabase link --project-ref <project-ref>
```

## Migrations

The migration tool is chosen in `SKILL.md` Step 3. With Supabase:

- Native Supabase migrations: follow `supabase-migrations.md`. Recommended, especially when the project uses Supabase Auth, Storage, or RLS policies.
- Drizzle or Prisma on Node.js: follow `drizzle.md` or `prisma.md`, pointed at `DATABASE_URL` on port 5432. Leave `supabase/migrations/` empty and say so in the README.
- Alembic on Python or goose on Go: follow the stack reference, pointed at `DATABASE_URL` on port 5432. Leave `supabase/migrations/` empty and say so in the README.

Whatever the choice, never let two tools write the same schema.

## Row Level Security

Document these rules in the README for the user's future tables. Do not create any tables or policies now.

- Enable RLS on every table in the `public` schema that any client could reach through the Supabase API:

```sql
alter table public.<table> enable row level security;
```

- With RLS enabled and no policies, the service role key still has full access, and anon or authenticated keys have none. That is the correct default for a backend-owned table.
- Do not write permissive policies to make something work. Add policies only when a client-side consumer needs them, and scope them to `auth.uid()`.
- Never duplicate `auth.users`. If the project uses Supabase Auth, application user data belongs in a `profiles` table with `id uuid primary key references auth.users(id) on delete cascade`, created by the user or by `init-auth`.

## Readiness check

Same contract as the stack reference. With the SDK path there are no tables to query, so request `GET {SUPABASE_URL}/rest/v1/` with the service role key as the `apikey` header and map any non-200 response or network error to 503.

## Tests

- Prefer the local Supabase stack from `npx supabase start` for integration tests.
- Skip integration tests cleanly when `DATABASE_URL` or `SUPABASE_URL` is unset.
- Never point tests at the hosted production project.

## Verification

```bash
npx supabase start
npx supabase migration list     # native Supabase migrations, reports none
# or the chosen tool's status command
<stack lint, typecheck, and test commands>
<stack dev command>              # then request /health/ready
npx supabase stop
```

Confirm the readiness endpoint returns 200 with the local stack up and 503 after `npx supabase stop`.
