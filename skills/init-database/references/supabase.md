# Supabase

Works with Node.js, Python, and Go. The backend talks to Supabase through the Supabase SDK, modeled on:
https://github.com/akdevsaha-dev/Truepantry/tree/main/backend

## Values needed

| Variable | What it is | Where it comes from |
| --- | --- | --- |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase MCP, or the user |
| `SUPABASE_KEY` | The project's secret key, `sb_secret_...`, or the legacy `service_role` key | Always the user, from Project Settings → API Keys |

The secret key bypasses Row Level Security. It stays in the backend `.env` only. Never use it in a frontend.

## Step 1: Check for the Supabase MCP

Look at your available tools for Supabase MCP tools, such as ones named `list_projects`, `get_project_url`, or `execute_sql` from a Supabase server.

### If the MCP is available

1. List the projects and ask the user which one to use. If there is only one, confirm it. Always include "Create a new project" as an option.
2. If there are no projects, or the user picks "Create a new project", follow "Creating a project" below.
3. Get the project URL from the MCP and write it to `SUPABASE_URL` in `.env`.
4. Ask the user to paste the secret key. The MCP cannot read secret keys. Until they paste it, write the placeholder.
5. Run `select 1` with the MCP's SQL tool to confirm the project is reachable.

If the MCP is connected to one project only, skip the listing and use that project.

#### Creating a project

1. Suggest a name from the project itself: the repository folder name, or the `name` in `package.json`, `pyproject.toml`, or `go.mod`. For example, a repository called `Truepantry` suggests `truepantry`. Ask the user to confirm or change it.
2. List the organizations. If there is more than one, ask which to use.
3. Pick the region closest to the user, or ask if unsure.
4. Check the cost with the MCP and show it to the user. Create the project only after they confirm.
5. Create the project and wait until its status is active, checking it with the MCP. This usually takes a minute or two.
6. Continue from step 3 above with the new project.

Never create a project without the user's confirmation.

### If the MCP is not available

Ask the user for:

- The project URL, or the project ref
- The secret key

If they do not have a project yet, tell them to create one at https://supabase.com/dashboard/new, named after the project, such as `truepantry`. Then ask for the URL and key again.

If they do not have the values ready, write placeholders and tell them where to find both: the Supabase dashboard, Project Settings → API Keys and Data API.

## Step 2: Supabase CLI folder

From the backend directory, if the Supabase CLI or `npx` is available:

```bash
supabase init
```

This creates `supabase/config.toml`, `supabase/.gitignore`, and `supabase/migrations/`. Leave `migrations/` empty.

If you know the project ref, tell the user to link it once:

```bash
supabase link --project-ref <project-ref>
```

If the CLI is not available, skip this step and include the commands in the report.

## Step 3: Environment

`.env` gets the real values, or placeholders. `.env.example` always gets placeholders:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-secret-key
```

Make sure `.gitignore` contains `.env`.

## Step 4: Config and client per stack

### Python

```text
backend/
├── src/
│   ├── core/
│   │   └── config.py
│   └── db/
│       └── supabase.py
└── supabase/
```

Install:

```bash
uv add supabase pydantic-settings
```

`src/core/config.py`: add the two fields to the existing `Settings`. If the file does not exist, create it:

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "API"
    environment: str = "development"

    supabase_url: str
    supabase_key: str

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

`src/db/supabase.py`:

```python
from functools import lru_cache

from supabase import Client, create_client

from src.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)
```

Call `get_supabase_client()` inside functions or through `Depends`. Do not call it at module import time.

### Node.js

```text
backend/
├── src/
│   ├── config/
│   │   └── env.ts
│   └── db/
│       └── supabase.ts
└── supabase/
```

Install:

```bash
npm install @supabase/supabase-js
```

`src/config/env.ts`: add `SUPABASE_URL: z.string().url()` and `SUPABASE_KEY: z.string().min(1)` to the existing Zod schema, or create the file with that schema.

`src/db/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
```

### Go

```text
backend/
├── internal/
│   ├── config/
│   │   └── config.go
│   └── db/
│       └── supabase.go
└── supabase/
```

Install:

```bash
go get github.com/supabase-community/supabase-go
```

`internal/config/config.go`: add `SupabaseURL` and `SupabaseKey` read from `SUPABASE_URL` and `SUPABASE_KEY`. Return an error from config loading if either is empty. Create the file if it does not exist.

`internal/db/supabase.go`: a `NewSupabase(cfg config.Config) (*supabase.Client, error)` function that calls `supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseKey, nil)`. Create the client once in `main.go` and pass it down. No package-level globals.

## Verify

- With the MCP, `select 1` already confirmed the project.
- With real values in `.env`, start the backend and confirm it boots without config errors.
- With placeholders, skip the connection check and say so.

## First migration

Tell the user:

```bash
supabase migration new <description>     # e.g. create_users_and_profiles
# write SQL in supabase/migrations/<timestamp>_<description>.sql
supabase db push
```

With the MCP, migrations can also be applied through its migration tool. Either way, keep every schema change as a file in `supabase/migrations/`.
