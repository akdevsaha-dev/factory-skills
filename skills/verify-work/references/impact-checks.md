# Impact checks

How to turn an impact map into a list of checks. Select from what the change affects. The presence of a frontend, database, or browser tool in the repository is never a reason by itself.

## Selection rules

1. **Start from the impact map.** For each line that names something, take the checks from the table below. For each line that says `none`, confirm it from the diff, and select nothing.
2. **Follow contracts to consumers.** A changed contract adds the checks of every consumer that uses the changed part. An additive change (a new optional field) needs only the producer's checks, unless a consumer validates strictly.
3. **Follow data to where it is shown.** A change in what an API returns reaches every page or client that renders it.
4. **Escalate with risk, not with file count.** One changed line in a payment path can need more checks than fifty lines of copy changes. Checks required in every profile are listed in `references/operating-rules.md`.

## By what changed

| Changed | Run | Not needed, unless |
| --- | --- | --- |
| Pure function or internal module | Its unit tests, the type check, and the tests of its direct callers | Integration or browser checks, unless a caller is an entry point whose behavior changes |
| Backend validation or business logic | Unit tests; API tests for each changed route, including the invalid-input and unauthorized paths; type check | Browser checks, unless the page depends on the changed response or error shape |
| API response or request contract | Producer tests; every consumer's tests and type checks; for a frontend consumer, its component tests and a browser check of each page that renders the changed field | Unaffected consumers: confirm by searching for the field or route |
| Database migration | Migration up, down if supported, then up again, on a disposable database; constraints against realistic rows; the queries and repositories that touch the changed tables; ORM or type regeneration | Browser checks; checks on tables the migration does not touch |
| Query or repository | Tests for the repository, with tenant or owner scoping; the services that call it | Browser checks, unless the result shape changes on a page |
| Frontend component or page | Its component tests; a browser check of the pages that render it, covering the changed interaction, loading, empty, error, and disabled states, console errors, and failed requests; keyboard and focus when interaction changed; a narrow viewport when layout changed | Backend and database checks, unless the component calls a changed endpoint |
| Styling only | A browser check of the affected pages at the relevant viewports | Unit, API, and database checks |
| Authentication or authorization | Allowed, denied, unauthenticated, and other-tenant cases for each entry point; the session or token lifecycle that changed; `references/invariants.md` | Browser checks, unless a sign-in or guarded page flow changed |
| Payments or money movement | `references/invariants.md` (payments), with the provider faked or in test mode; the checkout flow in a browser, when the UI changed | Real provider calls, which are never allowed |
| Background job, queue, or scheduled task | Running the job in tests with its inputs; retries, idempotency, and partial failure; what it writes | Browser checks |
| External integration or webhook | Contract tests against a fake; signature verification; timeouts and error responses; retries | Calls to the real service without approval |
| Configuration or env vars | The app starts with the new config; it fails clearly without a required value; `.env.example` is updated | Unrelated suites |
| Dependency upgrade | The full test suite and build of each package that uses it; the changelog's breaking changes against actual usage | — |
| Build, CI, or tooling | The changed pipeline step, run locally where possible | Product tests that the change does not affect |

## Worked selections

- **Backend-only validation change** (stricter email format in `POST /signup`): unit tests for the validator; API tests for valid, invalid, and existing-email requests; type check. No browser: the signup page already shows the API's error message and the error shape did not change. Skipped: browser, with that reason.
- **React component change** (new disabled state on `SubmitButton`): component tests for the button, and a browser check of each form that uses it, clicking it twice to confirm a single submission. No database checks.
- **Database migration** (adding a non-null `currency` with a backfill): up, down, and up on a disposable database; the backfill against existing rows; the queries that read the column. No browser.
- **Shared API response change** (renaming `total` to `totalCents`): producer tests, then every consumer found by searching for `total`: the web order page (component test and browser check), the mobile client's types, and the export job.
- **Payment feature** (refunds): the payment invariants, authorization on the refund route, migration checks, and the refund flow in a browser.
- **Full-stack matching feature** (mentor matching): matching logic unit tests, API tests including authorization, persistence of matches, consistency (no duplicate or one-sided matches, under concurrent requests), and the browser flow from request to accepted match.
