# Prisma Migrations

Node.js only. Read `postgres-node.md` first. This file supplies the schema, client, and migration details.

Prisma keeps the schema in `schema.prisma` and generates SQL migrations in timestamped folders.

## Version

Use the current stable Prisma major version and check its docs for configuration changes before generating files.

Prisma 7 and later differ from Prisma 6 in ways that matter here:

- The datasource URL moves from `schema.prisma` into `prisma.config.ts`.
- The `prisma-client` generator requires an explicit `output` path.
- The runtime client uses a driver adapter such as `@prisma/adapter-pg`.

Detect the installed version and follow the matching style. Do not mix them.

## Dependencies

```bash
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma @types/pg
npx prisma init --datasource-provider postgresql
```

Drop `@prisma/adapter-pg` and `pg` if the installed Prisma version does not use driver adapters.

## Files

```text
backend/
├── prisma/
│   └── schema.prisma           # generator and datasource only, no models
├── prisma.config.ts            # Prisma 7+
└── src/
    └── db/
        ├── client.ts
        └── generated/          # Prisma 7+ client output, gitignored
```

## Schema

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/db/generated"
}

datasource db {
  provider = "postgresql"
}

```

Do not add any `model` blocks. Do not run `prisma migrate dev` during setup, because it would create an empty migration. `prisma/migrations/` is created by the user's first migration.

Run `prisma generate` once so the client import works. If the installed version refuses to generate without models, skip it and note it in the completion report.

Document these rules in the README for later models:

- Use `@@map` and `@map` so tables and columns are `snake_case` plural in the database while models stay `PascalCase` in TypeScript.
- Use `@db.Timestamptz` on every `DateTime`.
- Use `@db.Uuid` for UUID columns.
- Add `@@index` for every foreign key.

## Client

`src/db/client.ts`:

- Create one `PrismaClient` for the process, using the driver adapter when required.
- Export `prisma` and `closeDb()`, which calls `prisma.$disconnect()`.
- On Supabase's transaction pooler (port 6543), add `pgbouncer=true` to the runtime URL or disable prepared statements in the adapter.

## Supabase connection URLs

Prisma migrations need the direct connection. The application should use the pooler.

- Migrations: `DATABASE_URL` on port 5432, read by `prisma.config.ts` or the `directUrl` field in older versions.
- Runtime: `DATABASE_POOL_URL` on port 6543, passed to the adapter or the `url` field.

## Scripts

Add to `package.json`:

- `db:migrate`: `prisma migrate dev`
- `db:deploy`: `prisma migrate deploy`
- `db:reset`: `prisma migrate reset`
- `db:generate`: `prisma generate`
- `db:studio`: `prisma studio`
- `postinstall`: `prisma generate`

## Workflow for the first and later migrations

Document this in the README. Do not perform it during setup.

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name <snake_case_description>`
3. Review `prisma/migrations/<timestamp>_<name>/migration.sql`.
4. Commit the schema and migration folder together.
5. Production and CI run `prisma migrate deploy` only. Never `migrate dev` against a shared database.

Prisma has no down migrations. To undo, write a new forward migration.

Things Prisma cannot express, such as RLS policies, triggers, and functions, go in a migration created with `prisma migrate dev --create-only --name <name>`, then edited by hand before applying.

Do not use `prisma db push` outside throwaway local experiments.

## Verification

```bash
npx prisma validate
npx prisma migrate status
```

Confirm `prisma/schema.prisma` has no models and no migrations exist.
