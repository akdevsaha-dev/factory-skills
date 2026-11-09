# Drizzle

Node.js only. Works with any Postgres provider.

## Install

From the backend directory:

```bash
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit
```

## Files

```text
backend/
├── drizzle.config.ts
├── src/
│   ├── config/
│   │   └── env.ts          # DATABASE_URL
│   └── db/
│       ├── index.ts        # single drizzle client
│       └── schema.ts       # empty, tables go here later
├── .env
└── .env.example
```

`drizzle.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

`src/config/env.ts`: add `DATABASE_URL: z.string().url()` to the existing Zod schema, or create the file with that schema if it does not exist.

`src/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = drizzle(client, { schema });
```

Match the existing import style of the backend for file extensions.

`src/db/schema.ts`: a comment saying tables go here. No tables.

## Environment

`.env` and `.env.example`:

```text
# Paste your Postgres connection string from Neon, Aiven, Supabase, RDS, or any provider.
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

Tell the user to replace the placeholder in `.env`.

## Scripts

Add to `package.json`:

- `db:generate`: `drizzle-kit generate`
- `db:migrate`: `drizzle-kit migrate`
- `db:studio`: `drizzle-kit studio`

## Verify

With a real `DATABASE_URL`, run a one-off `select 1` through the `db` client, then delete the script.

## First migration

Tell the user:

```bash
# add a table to src/db/schema.ts, then
npm run db:generate -- --name <description>
npm run db:migrate
```
