# Security requirements

These controls are required in every implementation. When the provider implements a control, configure it correctly and verify it; do not re-implement it. Provider defaults (expiry times, attempt limits, cookie settings) change, so check the current values in the provider's docs and the installed package rather than assuming them. Sources are at the end.

## Required baseline

Summarize these in the plan as "Baseline", separate from optional features:

- Server-side authentication on every protected entry point, with deny-by-default routing
- Server-side authorization, with ownership or tenant scoping inside data queries
- Provider-managed OTPs with short expiry and single use, plus the strongest attempt and rate limits the provider supports; report any gap as a residual risk
- Sign-in responses that do not reveal whether an account exists
- OAuth with PKCE and state, exact redirect allow-lists, and validated post-login redirects
- Secure cookies or verified short-lived bearer tokens, and CSRF protection for every cookie-authenticated write, including the app's own routes
- Rate limiting on authentication endpoints, with correct client IP detection
- Bot protection on public sign-up (provider built-in, or CAPTCHA when the user provides keys; otherwise list it under "Before production")
- Sign-out that revokes the server session or refresh token
- Roles, permissions, and memberships that users cannot grant themselves
- A sign-up policy (open or invite-only) enforced by the server for every sign-in method
- No secrets, OTPs, or tokens in logs, responses, URLs, or client bundles

## Secrets and configuration

- Secrets live only in server-side environment variables and the local `.env`. `.env` is gitignored; `.env.example` holds placeholders.
- Client-exposed prefixes (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`, and the framework's equivalent) never carry secret keys, auth secrets, OAuth client secrets, SMTP passwords, or webhook signing secrets.
- Validate configuration at startup and fail closed when a required secret is missing in production. No default secrets in code.
- Generate secrets with a CSPRNG and write them to `.env` without printing them.
- Each environment has its own credentials. Production values never appear in development files.

## Email OTP

Configure the provider so that:

- Codes come from a CSPRNG and have at least 6 digits.
- Codes expire within 10 minutes. Check the provider's default and lower it if needed.
- A code works once, and requesting a new code invalidates the old one.
- Wrong attempts are limited per code where the provider supports it, and sends and verifies are rate limited. Use the strongest limits the provider offers, and report what it does not cover as a residual risk instead of writing custom limiting code.
- Codes are stored hashed where the provider makes that optional.
- Resending has a cooldown, and the UI shows it.
- The response is identical whether or not the email exists or may sign up. Map every provider error except rate limiting to one neutral message.
- Codes never appear in logs, analytics, error trackers, URLs, or API responses, not even in development. Tests read codes from a fake mailer or the provider's test utility.
- The email states the code, its expiry, and what to do if the user did not ask for it.

## Magic links

- Single-use, short expiry, bound to the email that requested them.
- The token arrives in a URL. Exchange it right away, redirect to a clean URL, set `Referrer-Policy: no-referrer` on the landing route, and never log full callback URLs.
- Email security scanners can open links before the user does. If users report links that are already used, offer a confirmation step or switch to OTP.

## OAuth and OIDC

- Authorization code flow with PKCE (`S256`) and `state`, plus `nonce` for OIDC where used. Never the implicit flow.
- Redirect URIs registered exactly. Wildcards only outside production.
- Post-login redirects validated (see "Redirects and callbacks").
- Minimal scopes. Store provider tokens only when the app needs them, encrypted at rest.
- Link accounts only on emails the identity provider marks as verified.
- Callback errors show a generic message and never reflect provider error text unescaped.

## Sessions and cookies

- Sessions are provider-managed. Never mint your own session tokens.
- Cookies: `HttpOnly`, `Secure` in production, `SameSite=Lax` (needed for OAuth redirects), `Path=/`, and no `Domain` unless subdomains must share the session. Keep the provider's `__Host-` or `__Secure-` prefixes.
- The session identifier changes at sign-in and at privilege changes (provider-handled; confirm it).
- Absolute and idle lifetimes fit the risk. Sensitive actions (email change, MFA changes, account deletion, role management) require a recent sign-in.
- Sign-out revokes the server-side session or refresh token, not just the cookie.
- Bearer access tokens are short-lived and audience-restricted. Refresh tokens rotate, with reuse detection.
- Prefer `HttpOnly` cookies in browsers. Where an SDK keeps tokens in browser storage, reduce XSS risk with a strict Content Security Policy and no rendering of untrusted HTML.

## CSRF and CORS

- Cookie-authenticated requests that change state need CSRF protection. Built-in checks usually cover only the provider's own endpoints or framework features (check which). Every other route that accepts the session cookie and changes state checks Fetch Metadata (`Sec-Fetch-Site`) with an `Origin` fallback, or uses synchronizer tokens.
- Never change state on `GET`.
- APIs that authenticate only with bearer tokens are not exposed to CSRF. An endpoint that accepts both cookies and bearer tokens needs CSRF checks on the cookie path.
- Credentialed CORS uses an explicit origin allow-list. Never reflect arbitrary origins, and never combine `*` with credentials.

## Token verification in separate backends

Use this when an API verifies JWTs from Supabase Auth or Better Auth's JWT plugin. APIs behind Clerk use Clerk's backend SDK instead.

- Get the JWKS URL, issuer, audience, and signing algorithms from the provider's current docs. Set issuer and audience explicitly where the provider allows it.
- Use a maintained JOSE/JWT library for the stack. Look up its current API rather than writing verification by hand.
- Verify the signature against the JWKS with a pinned algorithm list, and require `exp`, `iss`, `aud`, and `sub`. Reject `alg: none` and any algorithm outside the list.
- Cache the JWKS and refetch on an unknown `kid`, with a cooldown (good libraries do this).
- Accept tokens only in the `Authorization: Bearer` header, never in query strings.
- A missing or invalid token returns 401 with `WWW-Authenticate: Bearer`. A JWKS that cannot be fetched is a server error: log it and return 5xx (503 where easy), never 401.
- Create the verifier once at startup and inject it, so tests can pass a local key set.
- If the verification call blocks on network I/O, make sure it does not block the event loop (for example, a sync dependency in FastAPI runs in a thread pool).

## Account takeover and linking

- Automatic account linking happens only on verified emails. Do not loosen the provider's linking rules without a stated reason.
- Changing an email address verifies the new one before switching, and notifies the old one.
- The sign-up policy is enforced by the server for every sign-in method, not just hidden in the UI. Client-side flags that skip user creation are not enforcement.
- Providers have protections against pre-account takeover (for example, clearing unverified credentials when an email is verified). Do not work around them, and mention them in the report.

## Authorization

Follow `authorization.md`. Required: checks on every entry point, deny by default, queries scoped by owner or tenant, no roles or tenant IDs taken from the client, and tests for IDOR and privilege escalation.

## Rate limiting and automation

- Authentication endpoints are rate limited by the provider or by configuration. Self-hosted limiters need shared storage (database or Redis) when there is more than one instance or the app is serverless.
- The client IP comes from a header your proxy overwrites, or from a trusted proxy list, never from a raw `X-Forwarded-For` set by the internet. If the limiter cannot see an IP, it may lump every client together, so one client can lock everyone out.
- App endpoints that send email or SMS, or do expensive work, are rate limited too.
- Public sign-up gets bot protection: the provider's built-in protection, or CAPTCHA (Turnstile or hCaptcha). Check which endpoints a CAPTCHA integration covers, and add the OTP endpoints if needed.

## Errors, logging, and enumeration

- Responses for existing and non-existing accounts are identical in body and close in timing.
- Log security events (sign-in success and failure, rate-limit hits, authorization denials) with a request ID and user ID.
- Never log codes, tokens, cookies, `Authorization` headers, secrets, or callback URLs that carry codes. Redact `authorization`, `cookie`, and `set-cookie` in request logging.
- Unexpected errors return a generic message and are logged on the server.

## Sign-out, recovery, and account deletion

- Sign-out calls the provider's revoke, clears cookies, and clears client caches that hold user data.
- With OTP-only sign-in, control of the inbox is the recovery path. Document how support handles a user who has lost access to their inbox, including identity checks.
- With MFA: recovery codes or a support process. Resetting MFA requires a recent sign-in and notifies the user.
- Deleting an account requires a recent sign-in, revokes all sessions, and deletes or anonymizes app data according to the retention policy.

## Passwords (only if the user enables them)

- Hashing is the provider's job.
- Follow the current NIST SP 800-63B length guidance: long minimums, no composition rules, a generous maximum, and a breached-password check.
- Rate-limit attempts and return generic errors.
- Password reset uses a single-use, expiring token, does not sign the user in automatically, and offers to revoke other sessions.

## Redirects and callbacks

Validate every post-login target (`next`, `redirectTo`, `callbackURL`) by parsing it, never with string checks alone:

1. Accept only values that start with `/`; otherwise use the fallback path.
2. Parse the value as a URL relative to a fixed dummy origin, with the platform's standard URL parser.
3. Use the fallback if parsing fails, if the resulting origin differs from the dummy origin, or if the normalized path starts with `//`.
4. Return only the normalized path, query, and hash.

URL parsing normalizes backslashes, tabs, and dot segments, so this rejects `//evil.com`, `/\evil.com`, `/.//evil.com`, `/%2e//evil.com`, `https://evil.com`, and `javascript:` URLs. Official provider examples sometimes check only `startsWith('/')`, which is not enough.

- Build absolute URLs from the configured app URL, never from `Host` or `X-Forwarded-Host`.
- Callback routes reject a missing or invalid `code` or `state` without creating a session.

## Frontend

- Hiding UI is cosmetic. The server enforces everything.
- After a production build, search the client bundle for the provider's secret key prefixes and secret variable names.
- Response DTOs expose only the fields the client needs.

## Dependencies and upgrades

- Use maintained SDKs at current stable versions compatible with the project.
- Search for security advisories affecting the installed versions of the auth SDK and the framework (especially middleware and route-matching bypasses), and upgrade past them.
- Run the dependency audit for the stack (see `verification.md`).

## Sources

Read the current versions when a rule above needs detail.

- OWASP Cheat Sheet Series (Authentication, Session Management, CSRF Prevention, Forgot Password, Multifactor Authentication, Authorization, IDOR Prevention, OAuth 2.0): https://cheatsheetseries.owasp.org
- RFC 9700, OAuth 2.0 Security Best Current Practice: https://www.rfc-editor.org/rfc/rfc9700.html
- NIST SP 800-63B: https://pages.nist.gov/800-63-4/sp800-63b.html
- The framework's own authentication and data security guides (for Next.js: https://nextjs.org/docs/app/guides/authentication)
