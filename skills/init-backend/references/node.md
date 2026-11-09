# Node.js Backend Standard

## Stack

- Node.js, current supported LTS
- TypeScript with strict mode
- Express
- Zod for validation
- dotenv for local environment configuration
- Vitest and Supertest for testing
- ESLint and Prettier

## Project structure

backend/
├── src/
│ ├── config/
│ │ └── env.ts
│ ├── routes/
│ │ ├── index.ts
│ │ └── health.routes.ts
│ ├── handlers/
│ │ └── health.handler.ts
│ ├── services/
│ │ └── health.service.ts
│ ├── validators/
│ │ └── health.schema.ts
│ ├── middleware/
│ │ └── error.middleware.ts
│ ├── app.ts
│ └── server.ts
├── tests/
│ └── health.test.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md

## Dependencies

Install:

npm install express zod dotenv

npm install -D typescript tsx @types/node @types/express vitest supertest @types/supertest eslint typescript-eslint prettier

## Required scripts

- dev: tsx watch src/server.ts
- build: tsc
- start: node dist/server.js
- typecheck: tsc --noEmit
- test: vitest run
- lint: eslint .
- format: prettier --write .

## Implementation rules

- Use ES modules consistently.
- Enable TypeScript strict mode.
- Configure Node-compatible module resolution.
- Keep app.ts separate from server.ts so tests can import the Express application without opening a port.
- Implement centralized error middleware.
- Use Zod to validate environment variables and incoming request data.
- Do not introduce a database or authentication system unless requested.
- Use process.env.PORT with a default of 8080.
- Configure SIGINT and SIGTERM handling.

## Health endpoint

GET /health

Response:

{
"status": "ok"
}

The route must call a handler, which calls the health service.

Do not add unnecessary validation to the health endpoint. Create the validators directory for future endpoints.

## Verification

- npm install
- npm run typecheck
- npm run lint
- npm test
- npm run build
- Start the server and request http://localhost:8080/health

Use compatible package versions and ensure the generated configuration works with the installed versions.
