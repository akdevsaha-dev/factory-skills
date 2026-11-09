# Go Backend Standard

## Stack

- Current supported stable Go release
- Go standard library net/http
- encoding/json
- log/slog
- Go modules
- Go built-in testing

Avoid third-party dependencies for the initial scaffold unless they provide a clear benefit.

## Project structure

All paths below are relative to the `backend/` directory. Create `backend/` first and generate every file inside it. Do not place `src/`, `tests/`, or config files at the repository root.

backend/
├── cmd/
│ └── api/
│ └── main.go
├── internal/
│ ├── config/
│ │ └── config.go
│ ├── routes/
│ │ └── routes.go
│ ├── handlers/
│ │ └── health.go
│ ├── services/
│ │ └── health.go
│ ├── validators/
│ │ └── validators.go
│ └── middleware/
│ └── middleware.go
├── tests/
│ └── health_test.go
├── .env.example
├── .gitignore
├── go.mod
└── README.md

## Initialization

Run every command in this file from inside the `backend/` directory (`mkdir -p backend && cd backend`).

Initialize a Go module using:

go mod init <module-name>

Ask for the module path only if it cannot be inferred from an existing module or repository configuration.

Use the standard library HTTP router and modern ServeMux routing.

## Architecture

Routes:
Register HTTP routes.

Handlers:
Handle HTTP requests and responses.

Services:
Implement business logic.

Validators:
Provide reusable request validation helpers when required.

Config:
Read environment variables and apply defaults.

Middleware:
Implement shared HTTP concerns only when necessary.

## Health endpoint

GET /health

Response:

{
"status": "ok"
}

Default port: 8080

## Engineering requirements

- Use http.Server with explicit timeouts.
- Support graceful shutdown with context.
- Use log/slog for structured logging.
- Use encoding/json for responses.
- Return appropriate HTTP status codes.
- Avoid global mutable application state.
- Do not add a database unless requested.
- Keep dependencies minimal.

## Development

go run ./cmd/api

## Build

go build -o bin/api ./cmd/api

## Tests

go test ./...

## Verification

- gofmt
- go vet ./...
- go test ./...
- go build ./...
- Start the server and request http://localhost:8080/health
