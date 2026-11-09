# Python Backend Standard — Factory Skills

## Purpose

Initialize a clean, maintainable FastAPI backend.

The architecture is inspired by:
https://github.com/akdevsaha-dev/Truepantry/tree/main/backend

Preserve its core conventions:

- `src/main.py` as the application entry point
- `src/api/router.py` for central route registration
- `src/api/deps.py` for reusable dependencies
- `src/api/v1/endpoints/` for versioned endpoints
- `src/core/` for application configuration
- `src/services/` for business logic
- `src/validation/` for Pydantic schemas
- `src/db/` for database integrations when required
- `src/llm/` for LLM integrations when required

Do not introduce a separate handlers directory by default.
FastAPI endpoint functions serve as HTTP handlers.

## Technology stack

Required:

- Python 3.12+
- FastAPI
- Uvicorn
- uv
- Pydantic v2
- pydantic-settings
- pytest
- HTTPX
- Ruff

Optional:

- Supabase Python SDK
- SQLAlchemy
- Alembic
- asyncpg
- Redis
- OpenAI or Anthropic SDK

Never install optional dependencies unless needed.

Use compatible stable versions, and commit `uv.lock`.

## Initialization

Initialize the project with uv.

Use the equivalent of:

```bash
uv init --bare
uv add fastapi "uvicorn[standard]" pydantic pydantic-settings
uv add --dev pytest httpx ruff
```

Configure the project for the `src` import package.

Use `src.main:app` as the application import path.

Use this default development command:

```bash
uv run uvicorn src.main:app --reload --port 8080
```

Do not mix the `src.main` package style with an
`app.main --app-dir src` layout.

## Project structure

```text
backend/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           └── health.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── logging.py
│   │   └── exceptions.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── health.py
│   └── validation/
│       ├── __init__.py
│       └── health.py
├── tests/
│   ├── conftest.py
│   └── test_health.py
├── .env.example
├── .python-version
├── .gitignore
├── pyproject.toml
├── uv.lock
└── README.md
```

Create additional directories only as needed:

- `src/db/`
- `src/models/`
- `src/repositories/`
- `src/llm/`
- `src/middleware/`

## Architecture responsibilities

### API endpoints

Located at `src/api/v1/endpoints/`.

Responsibilities:

- Define HTTP routes and methods.
- Parse and validate requests.
- Resolve dependencies.
- Call services.
- Return typed response models.
- Translate domain errors into HTTP responses.

Avoid putting database queries or large business
workflows directly inside endpoint functions.

Organize related endpoints into subdirectories
when the feature grows.

### API router

Located at `src/api/router.py`.

- Import feature routers.
- Include and organize routers.
- Use `/api/v1` as the default versioned prefix.
- Avoid duplicate prefix definitions.
- Do not register every endpoint in `main.py`.

### API dependencies

Located at `src/api/deps.py`.

Use FastAPI `Depends` for:

- Current user resolution
- Authorization dependencies
- Database sessions
- Shared service dependencies

Do not create database connections during module
import when they require external configuration.

Use dependency injection so tests can replace
external resources.

### Services

Located at `src/services/`.

Responsibilities:

- Business logic
- Coordination of application operations
- Reusable domain behavior

Services should not depend directly on FastAPI
Request or Response objects unless justified.

### Validation

Located at `src/validation/`.

Use Pydantic v2 for:

- Request payloads
- Response schemas
- Field validation
- Cross-field validation
- Data serialization

Use descriptive schema names such as:

- SignupRequest
- SigninRequest
- UserResponse
- HealthResponse

Do not expose database secrets or internal fields
through response models.

### Core

Located at `src/core/`.

Use:

- config.py for application settings
- logging.py for logging configuration
- exceptions.py for application-specific errors

Only create additional modules when required.

## Configuration

Use `BaseSettings` from pydantic-settings.

Use `SettingsConfigDict` for .env support.

Provide:

- app_name
- environment
- host
- port
- cors_origins

Set port to 8080 by default.

Use `@lru_cache` on the settings factory.

Do not require database credentials for an
application that has no database integration.

Never commit secrets.

CORS must use explicit allowed origins when
credentials are enabled.

Do not default to wildcard credentialed CORS.

## Health endpoint

Provide a public, unversioned endpoint:

GET /health

Return:

```json
{
  "status": "ok"
}
```

Also allow API versioning for future endpoints:

/api/v1/...

Keep health registration separate from
the versioned API router.

Implement health functionality without
requiring database, authentication, or LLM services.

Do not add an unnecessary dependency chain.

## Error handling

- Use appropriate HTTP status codes.
- Preserve intentionally raised HTTPException instances.
- Avoid returning internal exception details to clients.
- Log unexpected exceptions.
- Never log passwords, tokens, or API keys.
- Use consistent error responses.
- Avoid blanket try/except blocks that hide failures.

## Database integration

Do not install a database client automatically.

If the user requests a database, ask which
database or infer it from existing project files.

Supported options may include:

- Supabase
- PostgreSQL with SQLAlchemy
- PostgreSQL with asyncpg

For database-backed services:

- Use connection lifecycle management.
- Use database constraints for integrity.
- Use transactions where needed.
- Avoid creating clients at module import time
  when this complicates startup or testing.
- Include migrations when the selected stack
  owns the database schema.
- Avoid exposing privileged credentials.

## LLM integration

Create `src/llm/` only when AI features
are requested.

Suggested structure:

src/llm/
├── **init**.py
├── client.py
└── prompts.py

Keep provider initialization and prompts
separate from business services.

Add timeouts, bounded retries, and error handling.

Never install an LLM framework by default.

## Tests

Use pytest and HTTPX/FastAPI TestClient.

Create at least:

- Health endpoint test
- Configuration test
- Appropriate service unit tests

Tests must not need a live database for
pure application behavior.

Use dependency overrides or mocked external
services where appropriate.

## Code quality

Use Ruff for linting and formatting.

Require:

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

Use type annotations on public functions.

Prefer clear, minimal abstractions.

Avoid unnecessary classes for simple logic.

Do not introduce sync blocking operations
inside async endpoint functions.

## Documentation

Generate a useful README with:

- Stack
- Project structure
- Prerequisites
- Environment configuration
- Dependency installation
- Development command
- Testing commands
- API documentation URLs
- Deployment considerations

Generate `.env.example`.

## Verification

Before reporting completion:

1. Run dependency installation.
2. Run Ruff checks.
3. Run automated tests.
4. Start the application.
5. Request `http://localhost:8080/health`.
6. Confirm HTTP 200 and expected JSON.
7. Confirm Swagger documentation is accessible.
8. Report failures or unverified checks honestly.

Do not claim the project is production-ready
merely because it starts successfully.
