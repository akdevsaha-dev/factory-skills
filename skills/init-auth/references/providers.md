# Choosing a provider

This file holds the stable differences between the providers. Prices, plan limits, free tiers, and which features need a paid plan change often, so they are not listed here. When cost or plan gating affects the recommendation, read the provider's current pricing page and cite it.

| Provider | Docs | Pricing |
| --- | --- | --- |
| Supabase Auth | https://supabase.com/docs/guides/auth | https://supabase.com/pricing |
| Clerk | https://clerk.com/docs | https://clerk.com/pricing |
| Better Auth | https://better-auth.com/docs | Open source; you pay for your own infrastructure |

## Summary

| | Supabase Auth | Clerk | Better Auth |
| --- | --- | --- | --- |
| What it is | Auth service inside a Supabase project; open source and self-hostable | Hosted auth platform | Open-source TypeScript library that runs in your server |
| Where users live | Your Supabase Postgres | Clerk; your database stores Clerk user IDs | Your own database |
| Requires | A Supabase project | A Clerk application | A TypeScript server and a database |
| Server languages | Any; backends verify its JWTs through JWKS | Official SDKs for many languages | TypeScript runtimes only; other languages verify JWTs issued by a TypeScript auth server |
| Who sends OTP email | Supabase, through SMTP you configure | Clerk | Your code |
| Roles and organizations | You build them (tables, RLS, token claims) | Built in | Plugins |
| UI | You build it | Prebuilt components | You build it; headless client |
| Operated by | Supabase (or you, self-hosted) | Clerk | You |

Check the docs for current support of specific methods (passkeys, magic links, MFA types, enterprise SSO) and which plan each needs.

## Lock-in and exit

- **Supabase Auth**: users sit in your project's Postgres and tokens are standard JWTs. RLS policies and SDK calls tie the app to Supabase, but the data stays yours.
- **Clerk**: highest lock-in. UI, organization model, and sessions are Clerk-specific. Store only Clerk user and organization IDs in your tables to keep an exit path.
- **Better Auth**: lowest lock-in. Data and sessions live in your database. Changing libraries later still means rewriting auth code.

## Who owns which security work

| | Provider handles | You must handle |
| --- | --- | --- |
| Supabase Auth | OTP generation and checks, OAuth with PKCE, token issuing, refresh token rotation | Email delivery setup and templates, redirect allow-list, OTP expiry, CAPTCHA, RLS on every exposed table, token verification in separate backends, keeping the secret key on the server, authorization |
| Clerk | Authentication flows, email delivery, sessions, bot protection | Checks in every page, route, and action (not middleware alone), authorized-party checks, webhook verification, keeping roles out of user-writable metadata, authorization |
| Better Auth | Flow logic, OTP and session storage, origin checks on its own routes, OAuth state and PKCE, rate limit rules | Secret and base URL, trusted origins, cookie settings, rate limit storage and client IP trust, email delivery, schema migrations, upgrades and security patches, authorization |

## How to recommend

Go through these in order and stop at the first one that fits. If the project does not answer a question (for example, whether it is B2B), recommend on what you know and state the assumption.

1. **The project already uses Supabase** → Supabase Auth. One vendor, and RLS uses the same identity.
2. **B2B SaaS that needs organizations, invitations, or enterprise SSO soon, with little auth to operate** → Clerk. State the trade-offs: lock-in and per-user cost.
3. **Data residency, self-hosting, or no third-party user store is required** → Better Auth, or self-hosted Supabase if the project is already on Supabase.
4. **A TypeScript server with its own database** → Better Auth. Users stay in that database, there are no per-user fees, and plugins cover OTP, organizations, and admin roles.
5. **The only server is Python or Go** → Supabase Auth when Postgres ownership, RLS, or per-user cost matter; Clerk when prebuilt UI and built-in organizations matter more. Better Auth would need a separate Node auth service.
6. **Nothing decisive (new project)** → Better Auth for a TypeScript stack; Supabase Auth otherwise.

When two providers fit almost equally, say so and name the one question that decides it.

## What email OTP does and does not guarantee

Email OTP proves control of an inbox at sign-in. It is a sound primary method for most consumer and business apps, and it removes passwords. It is not phishing-resistant, and NIST SP 800-63B does not accept email as an out-of-band authenticator at AAL2. For high-risk apps (money movement, health data, admin consoles), recommend MFA or passkeys on top, and explain why.

## Combining methods

- Methods combine: email OTP, social login, magic links, and passkeys. Passkeys are registered after a first sign-in, so pair them with another method.
- Check how the provider sends OTPs and magic links. Some use one email template for both, so choosing both means one email with a code and a link.
- Automatic account linking must only happen on emails the identity provider marks as verified. Confirm the provider's linking rules in its docs.
