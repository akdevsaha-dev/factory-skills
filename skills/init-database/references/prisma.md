# Prisma

Node.js only. Works with any Postgres provider.

## Install

From the backend directory:

```bash
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install -D prisma @types/pg
npx prisma init --datasource-provider postgresql
```

Use the current stable Prisma version. Prisma 7 and later read the database URL from `prisma.config.ts` and need the `@prisma/adapter-pg` driver adapter. If an older major version is installed, put the URL in the `datasource` block instead and drop the adapter.

## Files

```text
backend/
├── prisma/
│   └── schema.prisma       # generator + datasource, no models
├── prisma.config.ts
├── src/
│   ├── config/
│   │   └── env.ts          # DATABASE_URL
│   └── db/
│       └── prisma.ts       # single PrismaClient
├── .env
└── .env.example
```

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

No `model` blocks. Add `src/generated/` to `.gitignore`.

`prisma.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
```

`src/config/env.ts`: add `DATABASE_URL: z.string().url()` to the existing Zod schema, or create the file with that schema if it does not exist.

`src/db/prisma.ts`: create one `PrismaClient` with `new PrismaPg({ connectionString: env.DATABASE_URL })` as the adapter. Export it as `prisma`. Import `PrismaClient` from the generated output path.

## Environment

`.env` and `.env.example`:

```text
# Paste your Postgres connection string from Neon, Aiven, Supabase, RDS, or any provider.
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

Tell the user to replace the placeholder in `.env`. On Supabase, use the direct or session connection on port 5432 for migrations.

## Scripts

Add to `package.json`:

- `db:generate`: `prisma generate`
- `db:migrate`: `prisma migrate dev`
- `db:deploy`: `prisma migrate deploy`
- `db:studio`: `prisma studio`

## Verify

```bash
npx prisma validate
npx prisma generate
```

With a real `DATABASE_URL`, also run `npx prisma migrate status`. It connects without changing anything.

If `prisma generate` refuses to run with no models, skip it and say so.

## First migration

Tell the user:

```bash
# add a model to prisma/schema.prisma, then
npx prisma migrate dev --name <description>
```
