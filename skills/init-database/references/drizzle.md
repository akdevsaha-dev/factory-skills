# Drizzle Migrations

Node.js only. Read `postgres-node.md` first. This file supplies the schema, client, and migration details.

Drizzle keeps the schema in TypeScript and generates plain SQL migrations you can read and review.

## Dependencies

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

## Files

```text
backend/
├── src/
│   └── db/
│       ├── client.ts
│       └── schema/
│           └── index.ts        # no tables yet
├── drizzle/                    # empty until the first migration
└── drizzle.config.ts
```

## Client

`src/db/client.ts`:

- Create one `postgres()` client with `max` from config, plus `idle_timeout` and `connect_timeout`.
- Wrap it in `drizzle(client, { schema })`.
- Export `db` and `closeDb()`, which calls `client.end()`.
- On Supabase's transaction pooler (port 6543), pass `prepare: false`.

## Schema

Create `src/db/schema/index.ts` with a comment explaining that each table lives in its own file in this directory and is re-exported here. Do not define any tables.

Do not run `drizzle-kit generate`. There is nothing to generate yet.

Document for later: one file per table using `pgTable`, inferred types via `$inferSelect` and `$inferInsert`, and `{ withTimezone: true }` on every timestamp.

## Configuration

`drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
});
```

On Supabase, `DATABASE_URL` here must be the direct connection on port 5432, not the pooler.

## Scripts

Add to `package.json`:

- `db:generate`: `drizzle-kit generate`
- `db:migrate`: `drizzle-kit migrate`
- `db:studio`: `drizzle-kit studio`

## Workflow for the first and later migrations

Document this in the README. Do not perform it during setup.

1. Edit the schema in `src/db/schema/`.
2. `npm run db:generate -- --name <snake_case_description>`
3. Review the SQL in `drizzle/`. Fix renames that were generated as drop and create.
4. `npm run db:migrate`
5. Commit the schema change and the generated files together.

Do not use `drizzle-kit push` outside throwaway local experiments. It bypasses migration history.

Drizzle Kit has no down migrations. To undo, write a new forward migration.

Things Drizzle cannot express in the TypeScript schema, such as RLS policies, triggers, and functions, go in a custom migration created with `drizzle-kit generate --custom --name <name>`.

## Query-only mode with native Supabase migrations

When `supabase-migrations.md` owns the schema:

- Install `drizzle-orm postgres` and `drizzle-kit`.
- Run `npx drizzle-kit pull` against the local Supabase database to generate the schema files.
- Re-run `pull` after every new Supabase migration.
- Remove `db:generate` and `db:migrate` scripts. Keep only `db:pull`.
- Restrict `pull` to the `public` schema with `schemaFilter: ['public']` in `drizzle.config.ts`.

## Verification

```bash
npx drizzle-kit check
```

Confirm `drizzle/` contains no migration files.
