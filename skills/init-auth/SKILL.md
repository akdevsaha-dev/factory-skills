---
name: init-auth
description: Add production-grade authentication and authorization to an existing project with Supabase Auth, Clerk, or Better Auth, then verify it with adversarial tests. Use when the user asks to add, set up, initialize, or implement auth, authentication, authorization, login, sign-in, sign-up, OTP, social login, sessions, roles, permissions, or access control.
---

# Initialize Auth

Add authentication and authorization to an existing project the way a staff engineer and security reviewer would: inspect first, recommend with reasons, let the user decide, build inside the project's own architecture, and prove that it works.

Auth is security-critical. Correctness beats speed, provider-managed mechanisms beat custom code, and nothing is complete until Step 5 has run.

## Ground rules

- **Official SDKs and documented flows only.** Do not write custom OTP generation, password hashing, session tokens, cookie signing, or OAuth handling when the provider supplies them.
- **Look up current information; never guess an API.** The references hold durable principles and checklists only. They deliberately contain no versions, prices, defaults, or SDK code, because those change. Get those from the provider's current official docs and the installed packages (see "Research" in Step 3).
- **Follow the project.** Reuse its structure, naming, config module, error format, logger, validation library, and test tools. Do not add frameworks, restructure folders, or refactor unrelated code.
- **Enforce on the server.** Every protected route, Server Action, RPC, job, and webhook checks authentication and authorization itself. Frontend guards and edge middleware or proxies are only for user experience.
- **Protect secrets.** Never print, log, commit, or return secrets, OTPs, session tokens, or connection strings. Secrets go only in the local `.env` (or the project's equivalent). `.env.example` gets placeholders.
- **No surprise features.** Add MFA, passkeys, organizations, enterprise SSO, audit logs, or impersonation only when the user chooses them.
- **Ask before outward-facing changes.** Get explicit confirmation before applying migrations to a non-local database, pushing provider configuration, creating provider projects or apps, or running commands that write to a hosted service.

## Workflow

1. Discover the project
2. Recommend and decide
3. Research and plan
4. Implement
5. Verify (mandatory)
6. Report

## Step 1: Discover

Inspect before recommending anything. Read the manifests, entry points, config module, and at least one representative route, service, data model, and test.

| Area | Find |
| --- | --- |
| Apps | Frontend, backend, and monorepo packages. Which app owns the database. |
| Stack | Language, framework, package manager, and installed major versions. Framework conventions (such as the middleware file name) can change between majors, so note the versions for Step 3. |
| Existing auth | Auth libraries or SDKs in the manifests (NextAuth/Auth.js, Better Auth, Clerk, Supabase, Passport, session or JWT libraries, Firebase, Auth0, and similar), auth calls in the code, and custom `users` or `sessions` tables. |
| Database | Supabase, Prisma, Drizzle, Kysely, SQLAlchemy, or raw SQL, with the migration tool and folder. |
| Conventions | Config and env validation, route registration, middleware or dependencies, services, validation (Zod, Pydantic), error response shape, logger. |
| Tests | Runner, HTTP test client, fixtures, how external services are faked. |
| Deployment | Host, serverless or long-running, number of instances, reverse proxy, and whether frontend and API share a site (`app.example.com` and `api.example.com`) or not. |
| Email | Existing transactional email provider. |

Show the user a short profile before recommending:

```text
Project        Next.js (App Router) in web/, Express API in backend/, TypeScript
Database       Postgres through Drizzle, owned by backend/
Existing auth  None
Tests          Vitest + Supertest
Deployment     web at app.example.com, API at api.example.com (same site)
```

Then place the project in one of these shapes, which decides where auth is enforced:

| Shape | Enforce auth in | Notes |
| --- | --- | --- |
| Full-stack framework (Next.js) | Its server: Data Access Layer, Route Handlers, Server Actions | It is the backend; no separate API is needed |
| Frontend plus separate API | The API | Pick cookies or bearer tokens with "Frontend with a separate API" below |
| API for mobile or third-party clients | The API | Clients use the provider's mobile SDK. Add deep-link redirect URLs to the provider's allow-list |
| SPA on Supabase with no server | Postgres RLS | Every table the client touches needs RLS for exactly the operations it performs |
| SPA with no server, choosing Clerk or Better Auth | Nothing yet | Better Auth needs a server; Clerk can sign users in, but protecting data needs a server. Offer `/init-backend` |
| Monorepo | The package that owns the data | Install SDKs per package; share types, never secrets |

### Stop and ask when

- **No application exists.** If the `init-backend` skill is available, ask: "No app found. Do you want me to create a backend with `/init-backend` first?" Otherwise show `npx skills add akdevsaha-dev/factory-skills --skill init-backend` and https://github.com/akdevsaha-dev/factory-skills, and offer to run the command.
- **Auth already exists.** Describe what you found and ask whether to extend it, replace it, or stop.
  - Extend: keep the current provider and skip the provider question.
  - Replace: this is a migration of users, sessions, linked accounts, and every foreign key that holds a user ID. Write a migration plan (user import, ID mapping, forced re-authentication, rollback) and stop for approval. Never do it as a side effect.
- **The chosen provider needs a database that is missing.** Better Auth needs a database: offer `/init-database` if it is available. Supabase Auth needs a Supabase project: when the project has a backend, offer `/init-database`; otherwise find or create the project through the Supabase MCP, or ask for its URL.

## Step 2: Recommend and decide

Read `references/providers.md`. If cost or plan limits could change the recommendation, check the providers' current pricing pages first. Recommend one provider in two or three lines that name the deciding facts and the main trade-off:

```text
Recommended: Better Auth. Your Express API already owns a Postgres database through Drizzle,
so users and sessions stay there with no per-user fees, and its plugins cover email OTP,
Google sign-in, and roles. Trade-off: you operate it, including email delivery.
```

Then ask the decision-critical questions in one round. Use a structured question tool if your environment has one; otherwise send one message with numbered options. Put the recommended option first and mark it "(Recommended)".

1. **Provider** (single choice): Supabase Auth, Clerk, or Better Auth. Always ask, even with a clear recommendation. Skip only when the user's message already names the provider.
2. **Sign-in methods** (multiple choice): Email OTP (default), Social login, Magic link, Passkeys. Methods combine. Passkeys are added after an account's first sign-in, so pair them with another method.
3. **Access control** (single choice), from the decision guide in `references/authorization.md`:
   - Resource ownership: users see and change only their own data (default)
   - Roles and ownership: adds roles such as `user` and `admin`
   - Organizations: multi-tenant teams with roles and permissions
   - Custom permissions: fine-grained permissions behind custom roles
4. **Optional features** (multiple choice, default none): MFA, Enterprise SSO, Audit logging, Session and device management.

Ask a short follow-up only when an answer requires it:

- Social login: which providers (Google, GitHub, Apple, Microsoft, others).
- Roles or organizations: confirm the proposed roles and their permissions.
- Better Auth: which email provider sends the codes, if the project has none.
- Unclear deployment: where the frontend and API run, when that decides cookies versus bearer tokens.

Infer everything else and state it as an assumption in the plan: framework integration, cookie or bearer transport, migration tool, open sign-up versus invite-only, session lifetime, and test approach.

If a choice cannot work with the project, explain why and ask again. For example, Better Auth needs a TypeScript server, so a Python-only backend would need a separate Node auth service.

## Step 3: Research and plan

### Research

Read the chosen provider's reference. Its "Look up before writing code" table lists what to find. Then get the current facts:

1. **Official docs.** Read the provider's current quickstart for the project's framework, plus the docs pages for each chosen method and feature. Prefer machine-readable docs when offered (Markdown pages, `llms.txt`, a docs MCP server).
2. **Versions.** Find the current stable version of each package and confirm it supports the project's framework and runtime versions. If a package is already installed at an older major version, read the provider's upgrade guide.
3. **Defaults.** Note the current defaults that the references tell you to check (OTP expiry, attempt limits, session lifetime, cookie settings, rate limits).
4. **Advisories.** Search for recent security advisories affecting the auth SDK and the framework versions you will use.
5. **Installed packages win.** Once installed, confirm each API, option, and default in the package's type definitions or source (or `go doc`, or the Python package's signatures). When the docs and the installed package disagree, follow the installed package and mention the difference in the report.

If web access is unavailable, rely on the installed packages' types, READMEs, and bundled docs. Say in the report which facts could not be checked against current docs.

### Plan

Present a concise plan and ask once for approval before changing files. Skip the approval only if the user already told you to proceed without it.

```text
Plan
Provider     Better Auth <current version> in backend/ (Express)
Methods      Email OTP, Google
Access       Resource ownership + user/admin roles
Files        create  src/auth/auth.ts, src/auth/email.ts, src/auth/permissions.ts,
                     src/middleware/auth.middleware.ts, tests/auth.test.ts
             modify  src/app.ts, src/config/env.ts, src/db/schema.ts
Packages     better-auth
Database     Generate auth tables and a Drizzle migration. You approve before it is applied.
Env          BETTER_AUTH_SECRET (generated locally), BETTER_AUTH_URL,
             GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, RESEND_API_KEY
You do       Create the Google OAuth client. Verify the sending domain in Resend.
Assumptions  Open sign-up. Web and API share a site. One instance; rate limits stored in the database.
Baseline     Hashed short-lived OTPs with attempt limits, rate limits, trusted origins, secure cookies
Optional     None selected
Tests        401 on every protected route, OTP expiry/reuse/attempts, IDOR, role escalation
```

Keep the required baseline from `references/security.md` separate from optional features, so the user can see what is always included and what they chose.

## Step 4: Implement

Read `references/authorization.md`, `references/security.md`, and `references/code-quality.md` before writing code, along with the provider reference and the docs gathered in Step 3. Auth code is read during every security review and incident, so it must be easy to follow: one obvious authentication boundary, small named permission checks, and comments only where a security decision needs its reason recorded.

Work in this order:

1. **Dependencies.** Install with the project's package manager. Use current stable versions compatible with the installed framework, and keep the lock file updated.
2. **Configuration.** Add every new variable to the existing config module with validation, and fail at startup when a required value is missing. Write `.env` (real values or placeholders) and `.env.example` (placeholders). Make sure `.gitignore` covers `.env`. Generate local secrets with a CSPRNG straight into `.env` without echoing them.
3. **Provider setup.** One client, instance, or token verifier, created where the project creates its other shared services, and injectable so tests can replace it.
4. **Database.** Auth tables, app tables that reference users (profiles, memberships), and RLS policies go through the project's migration tool. Review generated SQL. Apply migrations without asking only to a local or disposable database.
5. **Authentication boundary.** One middleware, dependency, or guard turns a verified session or token into a typed principal: user ID, session ID, roles or permissions, and active organization. Handlers receive the principal. They never read user IDs, roles, or organization IDs from the body, query, or unverified headers.
6. **Authorization.** Central permission checks plus ownership or tenant scoping in every data query, as described in `references/authorization.md`. Deny by default: a new route is protected unless it is explicitly public.
7. **Auth routes and UI.** Only what the flow needs: callback routes, sign-in and code-entry screens, sign-out. Use the provider's components when the project's UI allows; otherwise match the existing UI kit.
8. **Tests.** Write them alongside the code, following `references/verification.md`.
9. **Documentation.** Add the env vars, provider dashboard steps, and local setup to the project's README or docs.

### Where code goes

Reuse the project's existing locations. When there is no precedent, use the layouts that `init-backend` creates:

| Concern | Node.js (Express) | Python (FastAPI) | Go |
| --- | --- | --- | --- |
| Config | `src/config/env.ts` | `src/core/config.py` | `internal/config/config.go` |
| Provider setup or token verifier | `src/auth/` | `src/core/security.py` | `internal/auth/` |
| Principal and permissions | `src/auth/permissions.ts` | `src/core/permissions.py` | `internal/auth/permissions.go` |
| Authentication and permission checks | `src/middleware/auth.middleware.ts` | `src/api/deps.py` | `internal/middleware/auth.go` |
| Request and response schemas | `src/validators/` | `src/validation/` | `internal/validators/` |
| Tests | `tests/` | `tests/` | `tests/`, or next to the package |

For Next.js, follow the official Data Access Layer pattern: a `server-only` module that verifies the session and is called by every Server Component that loads data, every Server Action, and every Route Handler.

### Frontend with a separate API

The API verifies every request itself and never trusts user IDs, roles, or organization IDs sent by the frontend. Choose the transport from the deployment:

- **Same site** (`app.example.com` and `api.example.com`, or two `localhost` ports): cookies work with `SameSite=Lax`, plus credentialed CORS restricted to explicit origins.
- **Different sites** (for example `*.vercel.app` and `*.fly.dev`): browsers block third-party cookies, so send a short-lived bearer token in `Authorization`, or route API calls through the frontend's own domain. Do not switch cookies to `SameSite=None` unless the user accepts the trade-off and you add CSRF protection.

## Step 5: Verify

Verification is part of the job. Read `references/verification.md` and complete every section that applies: static checks, integration review, auth and adversarial tests, the route inventory test, the dependency audit, an independent security review, and a code-quality review of the diff against the checklist in `references/code-quality.md`. Fix every problem you find and rerun the affected checks.

Never report a check as passed unless it ran and passed in this session. Anything that needs live provider credentials, a provider dashboard, or a real inbox is reported as not verified, with exact manual steps.

## Step 6: Report

```text
Auth is set up with Better Auth <version>.

Methods      Email OTP, Google
Access       Resource ownership + user/admin roles
Files        <created and modified files>
Database     <migration files, and whether they were applied>

Verified (ran in this session)
  ✓ typecheck, lint, build
  ✓ 42 tests passed, including 18 auth and authorization tests
  ✓ dependency audit: no high or critical advisories

Not verified
  • Google sign-in end to end: needs real OAuth credentials
  • OTP email delivery: needs a verified sending domain

You need to
  1. Create the Google OAuth client with redirect URI <exact URI>
  2. Paste GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET into backend/.env
  3. Review and apply <migration file>

Before production
  • <provider-specific items: email delivery, own OAuth credentials, CAPTCHA keys, rate limit storage>
```

Also state deliberate trade-offs and limitations, such as how long a revoked JWT stays valid, and any facts that could not be checked against current docs.

Optional features (MFA, enterprise SSO, organizations, custom permissions, audit logging, session and device management, impersonation, policy engines) are added only when the user chose them.

## References

| Reference | Read when |
| --- | --- |
| `references/providers.md` | Step 2, before recommending |
| `references/supabase-auth.md`, `references/clerk.md`, `references/better-auth.md` | Step 3, for the chosen provider only |
| `references/authorization.md` | Step 2 for the access control question, and Step 4 |
| `references/security.md` | Step 3 for the baseline, Step 4, and the review in Step 5 |
| `references/code-quality.md` | Step 4 before writing code, and the review in Step 5 |
| `references/verification.md` | Step 4 for tests, and Step 5 |
