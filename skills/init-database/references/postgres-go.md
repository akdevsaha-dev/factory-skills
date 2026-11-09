# PostgreSQL for Go Backends

Applies to the Go standard-library backend produced by `init-backend`.

## Stack

- PostgreSQL 16+
- pgx v5 with `pgxpool` as the driver and pool
- goose for SQL migrations
- Plain SQL in repository functions. Do not add an ORM.
- Go built-in testing

sqlc is an acceptable addition when the user wants generated typed queries. Do not add it by default.

## Dependencies

Run every command in this file from inside the backend directory.

```bash
go get github.com/jackc/pgx/v5
go get github.com/jackc/pgx/v5/pgxpool
go get github.com/pressly/goose/v3
go install github.com/pressly/goose/v3/cmd/goose@latest
```

Pin the goose CLI version in the README or a `tools.go` file so contributors run the same one.

## Project structure

All paths below are relative to the backend directory. Add to the existing layout; do not restructure it.

```text
backend/
├── cmd/
│   └── api/
│       └── main.go             # open pool, pass to routes, close on shutdown
├── internal/
│   ├── config/
│   │   └── config.go           # add DatabaseURL, pool settings
│   ├── db/
│   │   ├── db.go               # NewPool(ctx, cfg), Ping
│   │   └── db_test.go          # connectivity test
│   └── ...
├── migrations/
│   └── .gitkeep                # empty until the first migration
├── docker-compose.yml
└── .env.example                # add DATABASE_URL
```

## Configuration

Extend `internal/config/config.go`:

- `DatabaseURL string` from `DATABASE_URL`, required when the database layer exists
- `DatabaseMaxConns int32` from `DATABASE_MAX_CONNS`, default 10

Add to `.env.example`:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app?sslmode=disable
```

## Pool

`internal/db/db.go`:

```go
func NewPool(ctx context.Context, cfg config.Config) (*pgxpool.Pool, error)
```

- Parse with `pgxpool.ParseConfig`, set `MaxConns`, `MaxConnIdleTime`, and `HealthCheckPeriod`.
- Use a `context.WithTimeout` of a few seconds for the initial `Ping`.
- Return the pool to `main.go`, which defers `pool.Close()` after the HTTP server shuts down.
- Never use a package-level global pool. Pass it explicitly to repositories and handlers.

## Schema

Do not create migration files. Create `migrations/` with a `.gitkeep` only.

Document for later: the first migration is created with `make migrate-create name=<snake_case_description>` and uses `-- +goose Up` and `-- +goose Down` sections.

## Migrations

Skip this section when native Supabase migrations were chosen. Do not install goose; follow `supabase-migrations.md` instead.


Run goose from the backend directory with explicit flags, or add a `Makefile`:

```makefile
DB_URL ?= $(DATABASE_URL)

migrate-up:
	goose -dir migrations postgres "$(DB_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DB_URL)" down

migrate-status:
	goose -dir migrations postgres "$(DB_URL)" status

migrate-create:
	goose -dir migrations create $(name) sql
```

Use sequential numeric filenames via `goose create`. Do not embed migrations into the binary and run them at startup unless the user asks for it.

## Repositories

Do not create repositories now. Document these rules in the README for later:

- One package per table under `internal/db/`, with a `Repository` struct holding the pool.
- Use `$1`-style placeholders only. Never `fmt.Sprintf` into SQL.
- Map `pgx.ErrNoRows` to a package-level `ErrNotFound`.
- Accept `context.Context` as the first argument everywhere.
- Services depend on a small interface they define, not on `*Repository`.

## Readiness check

Add `GET /health/ready` through the existing routes → handler → service chain:

- Call `pool.Ping(ctx)` with a short timeout.
- Return `200 {"status":"ok","database":"ok"}` on success.
- Return `503 {"status":"degraded","database":"unreachable"}` on failure. Log the error with `slog`; do not return it.

Leave `GET /health` unchanged and database-free.

## Local development

Use the same `docker-compose.yml` as the Node.js reference: `postgres:16-alpine`, database `app`, user and password `postgres`, port 5432, a named volume, and a `pg_isready` healthcheck.

## Tests

- `internal/db/db_test.go` opens a pool from `DATABASE_URL` and pings it.
- If it is unset or `Ping` fails, call `t.Skip` with a clear message.
- Existing health tests must not require a database.

## Verification

```bash
go mod tidy
docker compose up -d postgres
make migrate-status   # connects, reports no migrations
gofmt -l .
go vet ./...
go test ./...
go build ./...
go run ./cmd/api   # then request http://localhost:8080/health/ready
```

Confirm the readiness endpoint returns 200 with the database up and 503 with it stopped.
