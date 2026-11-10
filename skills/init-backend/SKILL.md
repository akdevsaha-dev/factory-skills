---
name: init-backend
description: Initialize a production-oriented backend project using Node.js with TypeScript, Python with FastAPI and uv, or Go. Use when the user asks to initialize, scaffold, bootstrap, or set up a backend.
---

# Initialize Backend

You are a senior backend engineer responsible for creating a clean, maintainable, production-oriented backend foundation.

## Step 1: Inspect the project

Before making changes:

1. Inspect the current working directory.
2. Identify existing files and project conventions.
3. Check whether a backend already exists.
4. Never overwrite existing code without explicit approval.
5. If an existing backend is found, ask whether to extend it or initialize a separate directory.

## Step 2: Choose the technology

If the user has not specified a stack, ask:

"Which backend stack would you like to initialize?"

Options:

1. Node.js + TypeScript + Express
2. Python + FastAPI + uv
3. Go + standard library HTTP server

Do not ask again if the user's request already specifies the stack.

## Step 3: Determine the project location

Always generate the backend inside a `backend/` directory at the root of the current working directory, even if the current directory is empty.

- Create `backend/` if it does not exist.
- Every file in the project structure (`src/`, `tests/`, `package.json`, `pyproject.toml`, `go.mod`, `.env.example`, etc.) goes inside `backend/`, never at the repository root.
- Run all install, build, test, and startup commands from inside `backend/`.

Only deviate from `backend/` when:

1. The user explicitly names a different directory, or
2. The repository already has an established backend directory convention (for example `server/` or `apps/api/`). In that case, follow the existing convention.

If the current directory is itself already named `backend`, use it directly instead of nesting another `backend/` inside it.

Ask only when the correct destination is genuinely ambiguous.

## Step 4: Read the relevant instructions

- Node.js: `references/node.md`
- Python: `references/python.md`
- Go: `references/go.md`

Read the selected reference and `references/code-quality.md` before generating files.

The stack reference decides the folder structure and files. `references/code-quality.md` decides how the code inside them is written. This scaffold becomes the template every later feature copies, so its code must be clean, idiomatic, and easy to understand at a glance.

## Step 5: Generate the project

Create a modular architecture with:

- routes: HTTP endpoint registration
- handlers: request and response handling
- services: business logic
- validators: request validation
- config: environment and application configuration
- middleware: shared HTTP behavior
- tests: automated tests

Do not create unnecessary abstractions or empty files merely to satisfy a directory structure.

## Step 6: Health endpoint

Implement:

GET /health

Expected HTTP status: 200

Expected JSON:

{
"status": "ok"
}

The server must listen on port 8080 by default, with an environment variable override.

## Step 7: Install dependencies

Use the selected stack's recommended package manager.

- Node.js: npm
- Python: uv
- Go: go modules

Use compatible stable package versions.

Generate the appropriate dependency and lock files.

## Step 8: Verify

Run all relevant checks:

1. Dependency installation
2. Formatting
3. Linting
4. Type checking, where applicable
5. Automated tests
6. Application startup
7. HTTP health endpoint smoke test
8. Self-review: re-read every generated file against the review checklist in `references/code-quality.md`, simplify what you can, and rerun the checks after any change

Do not claim a command passed unless it actually ran successfully.

If network access or permissions prevent verification, report that explicitly.

## Step 9: Completion report

Report:

- Selected stack
- Generated directory structure
- Installed dependencies
- Commands to run the backend
- Health endpoint URL
- Tests and checks executed
- Any remaining limitations

## Engineering principles

- Keep HTTP handlers thin.
- Put business logic in services.
- Validate untrusted input at system boundaries.
- Centralize configuration.
- Never commit secrets.
- Use structured error responses.
- Handle graceful shutdown.
- Preserve existing repository conventions.
- Never describe a scaffold as production-ready without verification.
