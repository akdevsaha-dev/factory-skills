# Better Auth

Docs: https://better-auth.com/docs

This file lists what to set up and what to check. It has no package versions or code, because Better Auth's options, plugins, CLI, and defaults change between releases. Before writing code, read the current docs pages below, check the installed version, and confirm every option in its type definitions. Prefer machine-readable docs if the site offers them (Markdown pages, `llms.txt`, or a docs MCP server).

## Fit

Better Auth runs inside a TypeScript server. If the API is Python or Go, Better Auth has to run in another TypeScript server (such as an existing Next.js app), and the API verifies JWTs from its JWT plugin. Do not add a new Node service without the user's agreement.

## Look up before writing code

| Topic | Find in the current docs |
| --- | --- |
| Install and CLI | The package, the current CLI command for schema generation and migration, and its runtime requirements |
| Database adapter | The adapter for the project's ORM and the ORM versions it supports |
| Framework integration | How to mount the handler for the project's framework, body-parser ordering, and how to read the session server-side |
| Email OTP plugin | Options for length, expiry, attempts, hashed storage, sign-up control, and the send callback |
| Social providers | Configuration, callback URL format, and account linking options |
| Rate limiting | Whether it is on outside production, storage options, and how the client IP is detected |
| Sessions | Lifetime, refresh, "fresh session" for sensitive actions, cookie cache, and revocation calls |
| Plugins chosen | `organization`, `admin`, `jwt`, `bearer`, two-factor, passkey, SSO, CAPTCHA |
| Testing | Official test utilities, and how to capture OTPs in tests |

## Environment

- An auth secret: generate it with a CSPRNG straight into `.env`. Confirm the minimum length in the docs.
- The public base URL of the auth server. Always set it; do not let Better Auth infer it from requests.
- Credentials for each social provider and the email provider.

Validate all of them in the project's config module.

## Server instance

- One instance, in the backend's shared services location. Keep the options in an exported object so tests can build a test instance from the same configuration.
- **Trusted origins** list every frontend origin. Never ship `localhost` origins in production config.
- **Rate limiting:** turn it on explicitly. Use database or Redis storage when there is more than one instance or the app is serverless.
- **Client IP:** always configure how the IP is read. If Better Auth cannot find an IP, every client may share one rate-limit bucket, so one client can lock out everyone. Behind a proxy, read a header the proxy overwrites or list trusted proxies; a raw `X-Forwarded-For` can be spoofed. Check the docs for whether Better Auth reads the socket address or only headers.
- **Email sending** goes through a small wrapper around the project's email provider, so tests can replace it. Do not await delivery before responding, or response timing reveals which emails exist; on serverless, hand the promise to the platform's `waitUntil` instead. Never log the code, the email address, or the request body.

## Database

1. Generate the auth schema after the plugin list is final, with Better Auth's current CLI.
2. Review the generated schema, then create a migration with the project's tool.
3. Apply it to a local or disposable database only. Ask before applying anywhere else.
4. Generate again whenever plugins change.

App tables that reference users use the same ID type as the generated user table, with a foreign key.

## Implementation rules

- Mount the auth handler before body parsing if the docs require it.
- Server-side session reads go through Better Auth's API. A cookie-presence check in edge middleware or a proxy is only for optimistic redirects, never for access decisions.
- Framework integrations that are community packages, not official, need the user's approval before adding.
- **OTP storage:** check the default. If codes are stored in plain text by default, enable hashed storage. Do the same for magic link tokens.
- Keep the default OTP generator. If one is ever needed, use a CSPRNG, never `Math.random`.
- **Invite-only:** disable sign-up on every method that can create users (email OTP, magic link, each social provider), plus a user-creation database hook that rejects unexpected users as a backstop.
- **CAPTCHA plugin:** check which endpoints it covers by default. Add the OTP send and sign-in endpoints if they are not included.
- **Redirect targets** (callback URLs) are checked against trusted origins. Calls made through the server-side API from your own code may skip origin, CSRF, and callback checks, so validate those inputs yourself.
- **Account linking:** keep implicit linking limited to verified emails. Do not add trusted providers or allow linking different emails without a stated reason. For high-security apps, disable implicit linking and link explicitly.
- Encrypt stored OAuth tokens when the app stores them.
- **CSRF:** Better Auth protects its own routes. The app's own cookie-authenticated routes need their own check (`security.md`). Never disable Better Auth's CSRF or origin checks.
- **Session cookie cache:** leave it off unless load requires it. While it is on, a revoked session can stay valid on other devices until the cache expires.
- **Sessions:** review the default lifetime and shorten it for sensitive apps. Use the "fresh session" setting to require a recent sign-in for sensitive actions.
- **Frontend and API on different sites:** cookies set by the API are third-party cookies and browsers block them. Prefer routing auth through the frontend's domain (rewrites or a proxy). The alternative is the bearer plugin, whose JavaScript-readable tokens are exposed to XSS; state that trade-off.
- **Subdomains:** a server on another subdomain cannot read the cookie unless auth is proxied through its domain or cross-subdomain cookies are enabled. The second option shares the cookie with every subdomain; state that trade-off.
- Apple's client secret expires. Put the renewal date in the report.

## Authorization

- **Roles (default):** add a role field to the user that clients cannot set at sign-up or through profile mapping, with a default of `user`. Map it to permissions as in `authorization.md`.
- **`admin` plugin:** only when the user chooses admin user management. Its default admin role may be able to impersonate users, change passwords and emails, delete users, and change roles. Define roles that leave out powers the user did not choose, and include the admin endpoints in the route inventory tests.
- **Organizations:** the `organization` plugin. For custom permissions, define access control as the docs show and pass it to both server and client. Check permissions server-side; client-side permission checks are for UI only.
- Verify membership in the active organization on the server for every tenant-scoped request.
- Create app-side rows (profiles, default memberships) in a user-creation database hook.

## Python and Go APIs

When Better Auth runs in a TypeScript server and the API is Python or Go:

- Add the JWT plugin and regenerate the schema. Set the issuer and audience explicitly.
- The client gets a short-lived token from Better Auth and sends it as `Authorization: Bearer`.
- The API verifies it following "Token verification in separate backends" in `security.md`. Get the JWKS path, default algorithm, and token lifetime from the plugin docs.
- These JWTs do not replace sessions. Signing out does not revoke an issued JWT; it expires on its own. State the window in the report.

## Mobile apps

Use Better Auth's official mobile integration and add the app's URL scheme to trusted origins.

## Testing

- Build a test-only instance from the shared options plus Better Auth's test utilities (with OTP capture if available). Never add test utilities to the production instance.
- Check whether Better Auth relaxes origin checks in test mode. If it does, turn them back on in the test instance so CSRF and origin tests see production behavior.
- Run tests against a dedicated test database with migrations applied. If none is available, report the database-backed tests as not run.
- Use a fake email sender that records calls, and assert codes never appear in responses or logs.
