# Factory Skills

Reusable engineering skills for AI coding agents.

Build consistent, maintainable software with Claude Code, Codex, and other compatible agents.

## Available skills

| Skill         | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| init-backend  | Initialize a backend with Node.js, Python, or Go                  |
| init-database | Add PostgreSQL or Supabase with migrations to an existing backend |

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
