# Security and reliability

Read this when the feature touches a trust boundary. Apply only the sections the feature needs, in proportion to the risk. Use the project's existing mechanisms (validation library, auth middleware, rate limiter, error handler) rather than building new ones.

To add authentication to a project that has none, use the `init-auth` skill if it is available.

## Which sections apply

| If the feature... | Read |
| --- | --- |
| Accepts input from users, clients, files, webhooks, or other services | Input |
| Reads or changes data that belongs to a user or tenant | Authorization, Data access |
| Writes several related records, or can run concurrently | Data access |
| Returns data or errors to a client | Output and errors |
| Handles secrets, tokens, or personal data | Secrets and personal data |
| Calls external services, or receives webhooks | External services |
| Moves money, sends messages, or performs other actions that must not repeat | External services, Data access |
| Accepts uploads or reads files by name | Files |
| Renders user-provided content or redirects users | Frontend and redirects |
| Exposes expensive or abuse-prone operations | Abuse |

## Input

- Treat everything from outside the process as untrusted: request bodies, query strings, path parameters, headers, cookies, files, webhooks, messages from queues, and responses from other services.
- Validate at the boundary with the project's validation library. Check type, format, length, range, and allowed values.
- Reject unknown fields where the project's validation allows it, so fields such as `role`, `ownerId`, or `isAdmin` cannot be mass-assigned.
- Never build SQL, shell commands, file paths, regular expressions, or HTML by concatenating input. Use parameterized queries, argument arrays, and the framework's escaping.

## Authorization

- Enforce authorization on the server for every entry point the feature adds: routes, server actions, RPC methods, background jobs, and webhooks. Hiding a button is not access control.
- Get the current user and tenant from the verified session or token, never from the request body or query.
- Scope queries by owner or tenant in the query itself (`WHERE id = $1 AND owner_id = $2`), not by fetching and comparing afterwards. This prevents IDOR.
- Follow the project's convention for denied access: 404 for resources the caller should not know exist, 403 for actions they may not perform.
- Use the existing permission helpers. Do not invent a parallel permission system.

## Data access

- Use parameterized queries or the ORM's query builder. Raw SQL only with bound parameters.
- Wrap related writes in a transaction, so a partial failure cannot leave inconsistent data.
- Avoid check-then-act races (read, check, then write). Use a unique constraint, a conditional update (`UPDATE ... WHERE status = 'pending'`), an upsert, or a row lock, and handle the conflict.
- Paginate or limit queries that can return unbounded results.
- Avoid N+1 queries in lists. Use the ORM's eager loading or a batched query.

## Output and errors

- Return only the fields the client needs. Do not serialize ORM entities or internal objects directly when they include sensitive fields.
- Never expose stack traces, SQL errors, internal IDs that should be hidden, or third-party error messages. Log them on the server and return the project's generic error format.
- Keep responses for "not found" and "not allowed" consistent with the project's convention, so they do not leak which records exist.

## Secrets and personal data

- Secrets come from the project's config module, never hard-coded, and never in client-exposed environment variables (`NEXT_PUBLIC_`, `VITE_`, and similar).
- Never log secrets, tokens, passwords, full card numbers, or authorization headers. Log personal data only as far as the project already does.
- Do not put tokens or personal data in URLs; they end up in logs and browser history.
- Add new environment variables to the config validation and to `.env.example` with placeholder values.

## External services

- Set timeouts on every outbound call. Use the project's HTTP client if it has one.
- Retry only idempotent operations, with a bounded number of attempts and backoff. Never retry a non-idempotent write blindly.
- For payments, emails, and other actions that must not repeat, use idempotency keys or a stored record of completed work, so a retry or a double click does not repeat the action.
- Verify webhook signatures with the provider's documented method before trusting the payload, and handle duplicate and out-of-order deliveries.
- Decide what the user sees when the service is down, and handle that state.

## Files

- Validate size and type on the server. Do not trust the client's file name or MIME type.
- Never build a file path from user input without normalizing it and confirming it stays inside the intended directory.
- Store uploads outside the web root or in object storage, with generated names.

## Frontend and redirects

- Do not render untrusted HTML (`dangerouslySetInnerHTML`, `v-html`, `innerHTML`) unless it is sanitized with a maintained sanitizer.
- Validate redirect targets from input against an allow-list or same-origin paths, to prevent open redirects.
- Keep authorization decisions on the server; client checks are only for user experience.

## Abuse

- Apply the project's rate limiting to endpoints that send email or SMS, call paid services, perform expensive work, or accept login-like guesses.
- Bound the size of inputs that drive work (batch sizes, page sizes, upload sizes).

## Review checklist

Use this in the self-review when this file applied:

- [ ] Every new entry point validates input and checks authorization on the server
- [ ] Data queries are scoped to the caller's user or tenant
- [ ] No string-built SQL, shell commands, paths, or HTML from input
- [ ] Related writes are transactional; concurrent requests cannot corrupt state
- [ ] Responses and errors expose nothing internal or sensitive
- [ ] No secrets or sensitive data in code, logs, URLs, or client bundles
- [ ] External calls have timeouts; retries are safe; repeated actions are idempotent
