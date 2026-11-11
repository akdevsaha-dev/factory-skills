# Runtime checks

How to exercise a running system once `references/impact-checks.md` calls for it. Use the project's own way of starting things, and stop everything you start.

## Starting the application

- Start only the processes the impact map's `Runtime` line names, with the project's scripts (`npm run dev`, `docker compose up api`, `uv run uvicorn ...`). Run them in the background and wait for readiness: the health endpoint, the log line, or the port.
- Point them at local or disposable services. Use test-mode keys and the project's fakes for external providers.
- Note the URLs and ports, and stop the processes when the checks finish.

## API checks

Use the project's API test setup when it has one (Supertest, httpx, `net/http/httptest`). Otherwise use `curl` against the running server:

```bash
curl -sS -i -X POST localhost:3000/api/refunds \
  -H 'content-type: application/json' -H "authorization: Bearer $TOKEN" \
  -d '{"paymentId":"pay_1","amountCents":500}'
```

Check the success path and each important failure: invalid input, unauthenticated, forbidden, not found, and conflict. Assert the status code, the response shape, and what was persisted, not just that the server answered.

## Browser checks

Use, in this order:

1. **The project's Playwright Test suite**, when it has one: run the specs for the affected pages (`npx playwright test tests/orders.spec.ts`). Add a spec when a deterministic regression test belongs in the suite.
2. **A browser tool from your environment**, such as a browser MCP server or a built-in browser, for exploring the page.
3. **Playwright CLI** (`@playwright/cli`) for token-efficient checks driven from the shell. It uses an installed Chrome when one exists. Run it from a scratch directory, because it writes snapshots and logs to `.playwright-cli/` in the current directory:

```bash
cd "$(mktemp -d)"
npx -y @playwright/cli open http://localhost:5173/orders/42
npx -y @playwright/cli snapshot              # element refs such as e12
npx -y @playwright/cli click e12
npx -y @playwright/cli fill e15 "50.00"
npx -y @playwright/cli console               # console errors
npx -y @playwright/cli requests              # failed requests
npx -y @playwright/cli screenshot            # evidence, when useful
npx -y @playwright/cli close
```

Check `npx -y @playwright/cli --help` for the commands your version supports.

In each affected page, cover:

- The changed interaction, done the way a user would, with the result checked in the page
- Navigation into and out of the page
- Loading, empty, and error states the change can produce. Force errors with the project's fakes, or with the CLI's `route` command
- No new console errors, and no failed requests
- Keyboard operation and focus, when the interaction changed
- A narrow viewport (`resize 390 844`), when the layout changed

## Database checks

- Use a disposable database: the project's test database, a container, or a temporary file. Never a shared or production database.
- Apply migrations with the project's tool. Run up, down (when supported), and up again.
- Check constraints and backfills against realistic existing rows, not only an empty table.
- Run the repositories and queries that touch the changed tables.

## Concurrency, retries, and idempotency

- **Concurrency:** send the same request in parallel (`for i in 1 2 3 4 5; do curl ... & done; wait`), or use `Promise.all` in a test, then assert the persisted state: one record, a correct balance, no duplicates.
- **Idempotency:** repeat a request with the same idempotency key, and assert one effect and identical responses.
- **Retries:** make the fake fail once, then succeed, and assert a single effect.

## Missing tooling

When a check needs something the project lacks, such as a browser driver, a database container, or a test framework:

1. Look for an equivalent the project already has.
2. Use a tool that runs without changing the project (for example `npx -y @playwright/cli` from a scratch directory) when that is safe.
3. Otherwise ask before adding anything to the project, or report the check as not run, with the reason and the command that would run it.

Never report a check as passed when it could not run.
