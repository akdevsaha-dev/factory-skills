# Authorization

Authentication establishes who the caller is. Authorization decides what they may do, on the server, on every request.

## Choose the model

Start with the simplest model that covers the product. Rows go from simplest to most complex; combine them as needed, and keep ownership checks in every model.

| Model | Use when | Skip when |
| --- | --- | --- |
| Resource ownership | Users create and manage their own data | Almost never; nearly every app needs it |
| Roles and ownership | A few global roles, usually `user` and `admin`, gate admin or staff features | There is no admin or staff surface |
| Organizations | Customers are teams: shared data, invitations, roles per organization | Users never share data with a group |
| Custom permissions | Roles keep multiplying, or customers define their own roles | Two or three fixed roles cover every case |
| ABAC | Rules depend on attributes: record state, amount, region, plan, time | A role or ownership check already expresses the rule |

Recommend resource ownership by default. Add roles only for a real admin surface, and organizations only for a multi-tenant product. Say plainly when an advanced model would add weight without protecting anything. Check whether the chosen provider supports custom permissions outside organizations.

ABAC rarely needs a framework. Write it as named policy functions, such as `canApproveInvoice(principal, invoice)`. Suggest a policy engine only when rules are numerous, change without deploys, or are shared across services, and never add one without the user's agreement.

## Rules

- **Deny by default.** Routes are protected unless explicitly public. Apply authentication at the router, app, or global-guard level, and mark public routes explicitly. A forgotten check then fails closed.
- **Check permissions, not role names.** Map roles to permissions in one place. Handlers ask for `project:delete`, not `admin`.
- **Scope every query.** Put the owner or tenant condition in the query itself (`WHERE id = $1 AND org_id = $2`). Fetching by ID and comparing afterwards in scattered code is how IDOR bugs happen. Updates and deletes use the same scoped condition and check the affected row count.
- **Identity comes from the principal.** Owner and tenant IDs for writes come from the verified principal, never from the request. Validate bodies strictly (reject unknown fields) so fields such as `role`, `ownerId`, or `orgId` cannot be mass-assigned.
- **Roles live where users cannot write.** Every provider has some user-editable profile or metadata field. Find it in the provider's docs and never read roles from it. Use server-only metadata, a roles table, or the provider's organization roles.
- **Guard role changes.** Changing a role requires a permission the caller holds. Block self-promotion, granting a role above the caller's own, and removing the last owner.
- **Expect stale claims.** Roles inside tokens update only when the token refreshes. For sensitive actions (role changes, payouts, deletions), read the current role from the source of truth.
- **Cover every entry point.** Route handlers, Server Actions, GraphQL resolvers, RPC methods, background jobs, webhooks, file downloads, and websocket messages all check authorization.

## Status codes

- **401:** no valid authentication. Bearer APIs include `WWW-Authenticate: Bearer`.
- **403:** authenticated, but the action is not allowed, and the caller may know the resource exists.
- **404:** the resource belongs to another user or tenant. Do not reveal that it exists.

Keep error bodies generic and in the project's existing error format. Check the framework's default status for missing credentials; some return 403 where 401 is correct.

## Principal and permissions

The authentication boundary produces one small, typed, immutable principal:

- user ID and session ID
- role (or roles)
- the permission set derived from the role through one central role-to-permission map
- active organization ID, for multi-tenant apps only

Map the provider's verified claims or session to the principal in one function. Treat an unknown role as having no permissions. Use the same role names as the provider so mapping never drops a valid role.

Tenant-scoped code takes a principal whose organization ID is required: return 403 when there is no active organization. Never pass an ID that may be undefined into an ORM filter. Some ORMs silently drop undefined conditions, which removes the tenant scope.

When the provider owns roles and permissions (organization features), use its permission keys and checks instead of keeping a second map.

## Enforcement by framework

Use the framework's standard mechanism, and look up its current API:

- **Express and similar:** an `authenticate` middleware on a protected router, plus a `requirePermission(permission)` middleware per route. Public routes such as `/health` live on a separate router. Store the principal somewhere no SDK writes to (for example `res.locals`).
- **FastAPI:** a `get_current_principal` dependency on protected routers, plus a `require_permission(...)` dependency per endpoint.
- **Next.js:** a `server-only` Data Access Layer. Every Server Component that loads data, every Server Action, and every Route Handler calls its helpers. Pages redirect signed-out users; Route Handlers return 401 or 403 JSON; Server Actions return an error result. Layout checks are not enough, because layouts do not re-run on navigation.
- **NestJS:** a global authentication guard with a `@Public()` metadata decorator, plus a permissions guard with a `@RequirePermissions(...)` decorator.
- **Go:** middleware that stores the principal in the request context under an unexported key type, wrapping the whole protected mux. Public routes go on a separate mux.

## Multi-tenant isolation

- Every tenant-owned table has a non-null `org_id`, indexed together with its main lookups (`(org_id, id)`).
- The active organization comes from the verified session or token, or from a path parameter. In every case, verify membership on the server for each request. A tenant ID in a path or header selects a tenant; it does not prove membership.
- Writes set `org_id` from the principal.
- Uniqueness rules include `org_id` when values are unique per tenant (slugs, emails within an organization).
- Background jobs, webhooks, caches, file storage paths, and search indexes carry the tenant ID and check it too.
- Postgres RLS keyed on tenant membership is defense in depth. It supplements application checks and does not replace them. Service-role and secret keys bypass it.
- Invitations are single-use, expire, and are bound to the invited email. Accepting one requires signing in with that email.

## Postgres RLS (Supabase, or any app exposing Postgres to clients)

- Enable RLS on every table in exposed schemas. Write policies for authenticated users only for the operations clients really perform.
- Tables for roles, memberships, plans, or entitlements get read policies at most, with insert, update, and delete revoked from client roles. Changes go through the backend or a `security definer` function that checks the caller's permission. Otherwise a user could insert an `admin` role or a membership in another organization.
- For membership checks, use a `security definer` function with an empty `search_path`, and revoke execute from roles that do not need it.
- Follow the provider's performance guidance for auth helper functions in policies, and index the columns policies compare.
- Never reference user-editable metadata in a policy.
- Requests made with the secret or service key bypass RLS, so backend code that uses it enforces authorization itself.

## Audit logging (optional)

Only when chosen. Record security-relevant events in an append-only table or log stream: sign-in success and failure, role and membership changes, admin actions, sensitive exports, and authorization denials. Store the actor, tenant, action, target, time, IP address, and request ID. Never store tokens, codes, or secrets. Restrict who can read the log, and set a retention period.
