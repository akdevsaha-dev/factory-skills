---
name: init-database
description: Connect an existing backend to a database using Prisma, Drizzle, or Supabase. Sets up config, the client, and environment variables without creating tables. Use when the user asks to initialize, set up, add, or connect a database.
---

# Initialize Database

Set up the database connection in an existing backend. The user owns the database itself; this skill only wires the backend to it.

Do not create tables, models, migrations, seed data, Docker files, or local database containers.

## Step 1: Inspect the project

1. Find the backend. Prefer `backend/`. If there is no backend, follow "No backend found" below and stop until one exists.
2. Detect the stack:
   - `package.json` → Node.js
   - `pyproject.toml` → Python
   - `go.mod` → Go
3. If Prisma, Drizzle, or Supabase is already set up, ask whether to continue before changing anything.

### No backend found

If the `init-backend` skill is available in this session, ask:

"No backend found. Do you want me to create one with `/init-backend` first?"

If they say yes, run it, then continue this skill inside the new `backend/`.

If the `init-backend` skill is not available, tell the user it can be installed, and ask whether to run the install command for them:

```bash
npx skills add akdevsaha-dev/factory-skills --skill init-backend
```

Always show the command and the repository link, so they can run it themselves:
https://github.com/akdevsaha-dev/factory-skills

After installing, they run `/init-backend`, then `/init-database` again.

## Step 2: Choose the option

Always ask the user before setting anything up. Never pick an option on your own, even when only one fits the stack or the project already has Supabase files.

Skip the question only when the user's own message already names the option, such as "/init-database with prisma".

Ask:

"How do you want to connect your database?"

Always show all three options:

| Option | Stacks | What the user provides |
| --- | --- | --- |
| Prisma | Node.js | A Postgres `DATABASE_URL` from any provider, such as Neon, Aiven, Supabase, or RDS |
| Drizzle | Node.js | A Postgres `DATABASE_URL` from any provider |
| Supabase | Node.js, Python, Go | A Supabase project, found through the Supabase MCP or given by the user |

On a Python or Go backend, still show Prisma and Drizzle, marked as Node.js only. If the user picks one of them, explain that it cannot run in this backend and ask again.

Wait for the user's answer before Step 3.

## Step 3: Read the reference and set it up

- Prisma: `references/prisma.md`
- Drizzle: `references/drizzle.md`
- Supabase: `references/supabase.md`

Also read `references/code-quality.md` before writing code. The option's reference decides which files to create and where; the code-quality reference decides how the code inside them is written. Match the backend's existing style: imports, naming, config access, and error handling.

Every option follows the same rules:

- **Config module.** Put database settings in the backend's existing config module. If it does not exist, create it:
  - Node.js: `src/config/env.ts`
  - Python: `src/core/config.py`
  - Go: `internal/config/config.go`
- **Client module.** Create one client in the backend's `db` folder and reuse it everywhere:
  - Node.js: `src/db/`
  - Python: `src/db/`
  - Go: `internal/db/`
- **Environment files.** Write `.env` and `.env.example` in the backend directory. `.env` holds real values, or a placeholder when the user has not given them yet. `.env.example` always holds placeholders. Make sure `.gitignore` contains `.env`.
- **No secrets in output.** Never print keys or connection strings back to the user, and never write them anywhere except `.env`.

## Step 4: Verify

1. Install dependencies with the stack's package manager.
2. Run the backend's existing type check or lint.
3. If real credentials are in `.env`, run the connection check from the reference. If only placeholders are there, skip it and say so.
4. Re-read every file you created or changed against the review checklist in `references/code-quality.md`. Fix what it finds and rerun the checks.

Do not claim a check passed unless it ran.

## Step 5: Report

Tell the user:

- What was set up and which files changed
- Exactly which values they still need to paste into `.env`, and where to find them
- The commands for their first migration
