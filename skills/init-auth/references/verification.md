# Verification

Run everything the environment allows, and record each command and its result for the report. A check that did not run is reported as not run, with the reason.

## 1. Static checks

Use the project's own scripts first (package scripts, Makefile, task runner, CI config). Otherwise use the stack's standard formatter, linter, type checker, build, and test commands.

Run the whole test suite, not only the new tests, to catch regressions.

## 2. Integration review

Re-read every file you created or modified, and check that:

- Imports resolve, and nothing is unused or duplicated.
- Every environment variable has the same name in the config schema, `.env.example`, and the docs. No secret uses a client-exposed prefix.
- Middleware order matches the provider's docs: auth handlers relative to body parsing, auth middleware before routes, CORS before auth routes, webhook routes with raw bodies before JSON parsing.
- Migrations match the schema the code uses, and any generated auth schema matches the installed plugin list.
- The public routes are exactly the intended list (health, auth handler, webhooks, sign-in pages).
- The project still starts with the new required configuration, and fails with a clear error when a required variable is missing.

## 3. Tests to write

Choose the rows that apply to the selected provider, methods, and access model. Use the project's test runner and HTTP test client.

### Authentication

| Case | Expected |
| --- | --- |
| No credentials, on every protected route | 401 |
| Malformed token, wrong signature, wrong `iss`, wrong `aud`, expired, `alg: none`, unknown `kid` | 401 |
| Token from an origin that is not an authorized party (where the provider checks it) | 401 |
| Valid credentials | Success, with the principal derived from the token or session, never from the request body |
| Session used after sign-out (any server session) | 401 |
| Public routes (`/health`, auth handler) | Reachable without credentials |
| Invite-only: a new email signs in through each enabled method (OTP, magic link, each social provider) | No user is created |

### Email OTP (when app code takes part, as with a self-hosted library or a backend that proxies the flow)

| Case | Expected |
| --- | --- |
| Correct code | Session created |
| Expired code (fake clock or a short test expiry) | Rejected |
| Code used a second time | Rejected |
| Wrong codes until the attempt limit, then the correct code | Rejected |
| Resend inside the cooldown | 429 |
| Unknown email (with sign-up disabled) versus known email | Identical status and body |
| Response bodies and captured logs during the flow | Contain no code |

### OAuth and redirects

| Case | Expected |
| --- | --- |
| Callback with no `code`, or an invalid one | Error redirect, no session cookie |
| `next` set to `//evil.com`, `/.//evil.com`, `/%2e//evil.com`, `https://evil.com`, `/\evil.com`, a path with a tab after the first `/`, or `javascript:alert(1)` | Falls back to the default path |
| `next` set to an allowed path with a query string | Preserved |

### Authorization

| Case | Expected |
| --- | --- |
| Each role against each protected action | Allowed or denied exactly as specified |
| User A reads, updates, or deletes user B's resource | 404 (or the project's convention) and no change |
| Member of organization A requests an organization B resource, including by changing the org ID in the path or header | 404 or 403, no data |
| Body includes `role`, `ownerId`, `orgId`, or similar | Ignored or rejected; never applied |
| User changes their own role, grants a role above their own, or removes the last owner | 403 |
| Create with another user's or tenant's ID in the body | Stored with the principal's IDs |
| Postgres RLS: an authenticated user writes a roles or membership row with the public key | Denied |
| Provider admin endpoints (if an admin plugin or API is enabled) called by a non-admin | Denied |

### Sessions, cookies, and CSRF

| Case | Expected |
| --- | --- |
| `Set-Cookie` with production settings | `HttpOnly`, `Secure`, `SameSite=Lax` (or the chosen value) |
| Cookie-authenticated state change from another origin | Rejected |
| Sign-out, then reuse the old cookie or refresh token | Rejected |

### Secrets and logging

| Case | Expected |
| --- | --- |
| Request logging with `Authorization` and `Cookie` headers | Both redacted |
| Production client bundle | No secret key prefixes or secret variable names |

## 4. Route inventory test

Prove that no protected route was missed.

- **Frameworks that expose their route table** (FastAPI, NestJS, and others): iterate the registered routes, skip an explicit public allowlist, substitute placeholder values for path parameters, and assert 401 for every other method and path. With a global guard and a public decorator, also assert that every public handler is on the intended list.
- **Next.js:** list every route handler file and every file with `'use server'`, and test or review each one for an auth check. Use a provider lint rule for unprotected handlers if one exists.
- **Frameworks without a stable route listing** (Express, Go's standard mux): keep an explicit table of protected endpoints in the test, and check by reading the code that every protected router is mounted behind the authentication middleware.

## 5. Testing without live providers

Automated tests never call real provider APIs, send real email, or use production credentials.

- **APIs that verify JWTs:** generate a key pair in the test with the algorithm the provider uses, inject it as the verifier's key set, and sign tokens with the real issuer and audience. Sign more tokens with a different key, an unknown `kid`, a different issuer, and an expired `exp` to cover the negative cases.
- **Hosted providers with SDK middleware:** replace the authentication boundary with fake principals for authorization tests. Keep at least one test that runs the real middleware or dependency and gets 401 for a missing or malformed token.
- **Self-hosted libraries:** use a test-only instance with the library's official test utilities and a dedicated test database (see the provider reference).
- **SSR apps:** unit-test the redirect validator, the Data Access Layer with a mocked provider client, and authorization inside Server Actions and Route Handlers.

## 6. Dependency and security checks

Run the stack's dependency audit for production dependencies (for example `npm audit`, `pip-audit`, `govulncheck`, or the package manager's equivalent). Look up current usage if unsure of the flags.

Also search the diff for secrets, debug logging of codes or tokens, and leftover `console.log` or `print` calls in auth code. If a tool needs network access that is unavailable, say so.

## 7. Independent review

Review the full diff against `security.md` and `authorization.md`, looking for missing checks, wrong assumptions, unhandled edge cases, and unnecessary complexity.

If you can start a subagent, give a reviewer the diff and those two files, and ask it to find vulnerabilities and gaps. Do not give it your conclusions. Confirm each finding yourself before changing code. Without subagents, do a second, separate pass over the diff using only the checklists.

Fix what you find and rerun the affected checks.

## 8. Live verification (optional, with consent)

Only with real development credentials and the user's agreement:

1. Start the app, request a code to an inbox the user controls, and have the user enter it. Use a brand-new address too: some providers send a different template on first sign-in.
2. Call a protected endpoint with the new session, and confirm it succeeds.
3. Sign out, then confirm the same request returns 401.
4. Complete one social sign-in per configured provider.

Never read the user's inbox or use their credentials yourself.

## 9. Done when

- All static checks and tests ran in this session and passed, or every failure is reported with its output and cause.
- Every protected entry point has been shown to reject unauthenticated requests.
- Authorization tests cover ownership or tenant isolation and privilege escalation for the chosen model.
- No secrets in the repository, logs, or client bundles.
- Everything not verified is listed with the exact manual steps.
