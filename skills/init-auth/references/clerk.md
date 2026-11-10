# Clerk

Docs: https://clerk.com/docs

This file lists what to set up and what to check. It has no package versions or code, because Clerk's SDKs change between major versions (component names, middleware helpers, and redirect props have all been renamed before). Before writing code, read the current quickstart for the project's framework, check the installed SDK's major version, and confirm every call in its type definitions. If the project is on an older major version, read Clerk's upgrade guide first.

## Look up before writing code

| Topic | Find in the current docs |
| --- | --- |
| Packages | The current SDK for each part of the project (frontend framework, backend language) and which older packages are deprecated |
| Environment | The variable names each SDK reads |
| Middleware | The current middleware setup and matcher for the framework, and how to pass authorized parties |
| Server checks | How to read the auth state in pages, route handlers, server actions, and backend requests, and what each helper returns when signed out (redirect, 404, or nothing) |
| Components | The current sign-in, sign-up, user button, and conditional-render components |
| Roles and permissions | Metadata types, session token customization, and the organization permission check |
| Webhooks | The webhook verification helper for the framework |
| Testing | The official testing package and testing tokens |

## Before you start

- A Clerk application with development keys. Clerk's CLI can create apps and write keys, but it creates a hosted resource, so ask before running it.
- Production needs its own Clerk instance on the app's domain and your own OAuth credentials for every social provider.
- The secret key is shown only once in the dashboard.

## Dashboard configuration

Clerk is configured in its dashboard. List these steps for the user; menu names change, so describe the setting, not the click path.

- **Email OTP:** enable email verification codes as a sign-in method. Disable methods the user did not choose, such as passwords.
- **Magic links:** enable email links if chosen.
- **Social providers:** enable each one. Production needs your own client ID and secret, with the redirect URI the dashboard shows.
- **Sign-up policy:** public, restricted (invite-only), or waitlist.
- **Sessions:** maximum lifetime and inactivity timeout. Check whether changing them needs a paid plan.
- **Organizations:** enable only for multi-tenant apps. Define roles and permissions.
- **Session token claims:** add custom claims only when needed, and keep them small (Clerk documents a size limit).

Clerk sends codes and links itself and includes bot protection. Check the current docs for code lifetime and resend cooldown, and include them in the report.

## Implementation rules

- **Authorized parties.** Pass the allowed frontend origins to every server-side verification. Reuse the backend's CORS allow-list. Validate in config that the list is non-empty in production, because an empty list can silently skip the check.
- **Protect where code runs, not in middleware.** Middleware route matchers have had bypass vulnerabilities. Check auth in every page, route handler, server action, and API handler itself. Use middleware only for session handling and redirects. If Clerk offers a lint rule that finds unprotected handlers, use it.
- **JSON APIs return 401 and 403 themselves.** Some Clerk protect helpers redirect or return 404. Route handlers and APIs read the auth state and return their own status codes.
- **Server actions** check auth at the top of every action. They are public POST endpoints.
- **Conditional-render components only hide UI.** They are not access control.
- **Backends restrict accepted token types to session tokens** when the SDK also accepts API keys, M2M, or OAuth tokens by default.
- **Backend middleware that lets anonymous requests through** (attaching claims only when a token is present) must be followed by a check that rejects requests without claims.
- **Pending sessions.** When organizations are required, reject sessions that have not chosen an organization yet if the SDK does not.
- **No official SDK for the framework** (for example NestJS): use the backend SDK's request authentication in a global guard, converting the request if needed.
- Do not use deprecated helpers that redirect from JSON APIs.

## Authorization

- **Without organizations:** keep the app role in public metadata, which only the backend can write. Expose it through session token customization. Never read roles from metadata users can write themselves (`unsafeMetadata`).
- **With organizations:** check permissions with Clerk's server-side permission check. Confirm in the docs which permissions appear in the session token (custom permissions only, or system ones too), and whether billing plans affect permission checks.
- Your tables store the Clerk user ID and organization ID as owner and tenant keys. Scope every query with them.
- Role changes reach the session token only at its next refresh. For sensitive actions, read the current role from Clerk's Backend API.

## Webhooks (user sync)

Add webhooks only if the app needs Clerk users or organizations in its own tables.

- Verify every event with Clerk's webhook helper. Webhook routes need the raw body, so mount them before JSON parsing.
- The webhook route is public; the signature is its authentication.
- Deliveries can repeat or arrive out of order. Deduplicate by the delivery ID, upsert on both create and update events, compare `updated_at` before overwriting, and soft-delete.
- Do not rely on a webhook during sign-up or onboarding; it may not have arrived yet.

## Sessions and sign-out

- Session tokens are short-lived and refreshed by the SDKs. With networkless verification, a revoked session stays valid until its token expires. State that window in the report.
- Revoke sessions server-side through the Backend API when needed.

## Testing

- Unit and integration tests replace the authentication boundary with fake principals and test the authorization matrix against it.
- Keep at least one test that runs the real Clerk middleware or dependency and confirms that missing or malformed tokens get 401.
- For end-to-end browser tests, use Clerk's official testing package; read its docs for the installed version.
