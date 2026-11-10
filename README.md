# Factory Skills

Reusable engineering skills for AI coding agents.

Build consistent, maintainable software with Claude Code, Codex, and other compatible agents.

## Available skills

| Skill             | Description                                                                    |
| ----------------- | ------------------------------------------------------------------------------ |
| init-backend      | Initialize a backend with Node.js, Python, or Go                               |
| init-database     | Connect a backend to a database with Prisma, Drizzle, or Supabase              |
| init-auth         | Add authentication and authorization with Supabase Auth, Clerk, or Better Auth |
| implement-feature | Implement a feature in an existing codebase to senior-engineer standards       |

## Installation

Install directly from GitHub:

```bash
npx skills add akdevsaha-dev/factory-skills --skill init-backend
```

Install for Codex:

```bash
npx skills add akdevsaha-dev/factory-skills --skill init-backend -a codex
```

Install for Claude Code:

```bash
npx skills add akdevsaha-dev/factory-skills --skill init-backend -a claude-code
```

Install globally:

```bash
npx skills add akdevsaha-dev/factory-skills --skill init-backend -g
```

## Usage

In a supported coding agent:

```text
/init-backend
```

Or explicitly request:

```text
Use the init-backend skill to initialize a Python backend.
```

The skill supports:

- Node.js + TypeScript + Express
- Python + FastAPI + uv
- Go + standard library

Every generated backend includes:

- Routes
- Handlers
- Services
- Validators
- Configuration
- Tests
- Health endpoint on port 8080

## Philosophy

Skills define engineering workflows.
Templates and scripts provide deterministic setup.
Automated tests verify generated code.

A successful scaffold is a foundation, not proof of production readiness.

## Contributing

Each skill is installed on its own, so it cannot read files from another skill. Shared standards are copied into every skill that needs them. `references/code-quality.md` is identical in `implement-feature`, `init-backend`, `init-database`, and `init-auth`: edit one, then copy it to the others.
