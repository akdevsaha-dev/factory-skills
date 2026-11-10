# Supabase Auth

Docs: https://supabase.com/docs/guides/auth

This file lists what to set up and what to check. It has no package versions or code, because Supabase's SDKs, key formats, and defaults change. Before writing code, read the current docs pages below for the installed SDK version, and confirm every call in the installed type definitions.

## Look up before writing code

| Topic | Find in the current docs |
| --- | --- |
| Packages | The current client SDK, the SSR/cookie package for the framework (if any), and which older packages are deprecated |
| Keys | The current key types: which key is safe in browsers, which is server-only and bypasses RLS, and whether legacy keys are deprecated |
| JWT signing | Whether the project uses asymmetric signing keys (its JWKS endpoint returns keys) or a legacy shared secret, and how backends should verify tokens in each case |
| Framework guide | The official server-side auth guide and example for the project's framework (for Next.js, the official `nextjs` auth example in the Supabase repo) |
| Email OTP | The OTP sign-in and verify calls, the template variable that shows the code, and the default expiry, length, and rate limits |
| Social sign-in | The OAuth sign-in call, the callback code exchange, and how to enable PKCE |
| Token claims | Which claim holds the user ID, session ID, assurance level (MFA), and anonymous flag |
| Roles | The custom claims / RBAC guide and the custom access token hook |
| Configuration | Which settings live in the dashboard and which in `supabase/config.toml` |

## Before you start

1. **A Supabase project.** If the project has a backend not yet connected to Supabase and `/init-database` is available, run it with Supabase first. Without a backend, find or create the project through the Supabase MCP if available, or ask the user for the project URL.
2. **Keys.** Browser code uses only the public key. The secret key stays on the server and bypasses RLS. Token verification should not need the secret key.
3. **Signing keys.** Check the project's JWKS endpoint. If it uses a legacy shared secret, recommend migrating to asymmetric signing keys. Until then, backends must verify each token by calling Supabase, not locally.

## Project configuration

The Supabase MCP may not be able to change auth settings. Never claim a setting was configured unless you changed it and confirmed it.

Required:

- **Site URL and redirect allow-list.** Exact production URLs, including the callback path. Wildcards only for preview deployments.
- **Email delivery.** The built-in sender is for development only and heavily limited. Production needs custom SMTP or a send-email hook.
- **OTP email.** Make sure the template the sign-in flow uses shows the code. A first sign-in by a new user may use a different template (sign-up confirmation), so check that one too.
- **OTP expiry.** Check the default; lower it to 10 minutes or less if it is longer. Check whether this setting also affects confirmation, recovery, and invite links.
- **Attempt limits.** Check whether Supabase limits wrong attempts per code or only per IP. If only per IP, enable CAPTCHA, consider longer codes, and report the gap as a residual risk.
- **Sign-up policy.** Invite-only must be enforced in project settings. A client option that skips user creation is UX, not enforcement.
- **Social providers.** Enable each with its credentials and register the Supabase callback URL in the provider's console.

`config.toml` is shared by the local stack and the CLI's config push. Before pushing, make sure every URL targets the hosted project, have the user review the diff, and push only with their approval. When unsure, give the user the dashboard steps instead.

## Implementation rules

- Run sign-in flows in the client with the Supabase SDK. Proxy through your backend only when a client cannot use the SDK. Then never sign in on a shared server client: Supabase clients keep the signed-in session, so later queries would run as that user. Create a short-lived per-request client with the public key and no session persistence.
- **Never authorize on the server with an unverified session read from cookies.** Use the SDK method that verifies the JWT (or the one that calls Supabase, when bans and sign-outs must apply immediately). Check the docs for which method does which.
- SSR frameworks: copy the cookie utilities from the official example for the installed SSR package version. Follow its rules for the session-refresh middleware or proxy exactly. That layer refreshes sessions; it is not the authorization layer.
- OAuth and magic-link callbacks validate any `next` parameter as in `security.md`. Official examples may check only that it starts with `/`, which allows `//evil.com`.
- Build redirect URLs from the configured site URL, never from request `Host` headers.
- SPAs: the SDK may keep the session in browser storage. Keep a strict Content Security Policy and never render untrusted HTML. Fetch the current access token right before each API call.
- Normal sign-out should end only the current device's session. Check the SDK's default scope; it may sign out every device.
- Apple's client secret expires. Put the renewal date in the report.

## Backend token verification

Separate APIs verify Supabase access tokens following "Token verification in separate backends" in `security.md`. Get the JWKS URL, issuer, audience, and algorithms from the current docs. Supabase's own claim helpers may not check issuer and audience, so do not rely on them as the API's verifier without confirming.

Map claims to the principal:

- The user ID and session ID come from verified claims.
- The app role comes from server-controlled metadata or a custom claim set by the access token hook. Supabase's `role` claim is the Postgres role, not an app role.
- Reject anonymous users unless anonymous sign-in is a deliberate feature.
- Require the MFA assurance level where MFA is enforced.

A JWT stays valid until it expires, even after sign-out or a ban. For sensitive operations, also check the user with Supabase, or shorten the JWT lifetime. State the remaining window in the report.

## Authorization

- **Simple roles:** stored in metadata that only the server can write, set through the admin API with the secret key. Never in metadata users can edit themselves (`user_metadata`). Confirm in the docs which metadata is user-writable.
- **Managed roles or permissions:** a roles table plus a custom access token hook. Follow the official RBAC guide. Lock the hook function down so only the auth service can execute it.
- Claims change only when the token refreshes.

RLS, for every table in an exposed schema. Supabase grants table access to anonymous and authenticated roles, so policies decide what the browser can do with the public key:

- Write policies only for the operations clients really perform.
- Tables that hold roles, memberships, plans, or entitlements get read policies at most, with insert, update, and delete revoked from client roles. Changes go through the backend or a security definer function that checks permission.
- Tables only the backend uses get RLS enabled with no policies.
- A role column on a row the user owns (such as `profiles.role`) is writable through that row's update policy. Keep roles in a separate table or server-only metadata.
- Index the columns policies compare, and follow the docs' performance advice for policy helper functions.

Write migrations with the Supabase CLI in `supabase/migrations/`, the same as `init-database`. Apply them only after the user approves. See `authorization.md` for multi-tenant rules.

## Testing

- Backend verifier: generate a local key pair, inject it as the key set, and sign tokens with the real issuer and audience (see `verification.md`).
- SSR apps: unit-test the redirect validator, the Data Access Layer with a mocked Supabase client, and authorization in actions and route handlers.
- RLS: if the project already runs the local Supabase stack, test policies with SQL as different users. Otherwise list the policies as not verified, with the SQL to check them.
