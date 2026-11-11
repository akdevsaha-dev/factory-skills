---
name: verify-work
description: Verify a code change by what it actually affects, then run the checks for real. Traces the diff through contracts, consumers, data flow, and runtime to choose only the tests, API calls, migrations, and browser checks that matter, runs them narrow to broad, and reports evidence without overstating anything. Use after implementing a change, before review or merge, or when asked to test, verify, check, or prove that a change works.
---

# Verify Work

Prove that a change does what it should and breaks nothing it touches, with checks chosen by impact, not by which technologies the repository contains. A browser check is run because a page is affected, never because the repository has a frontend.

Read `references/operating-rules.md` and `references/verification.md` first. This skill does not change product code. It may add tests that an acceptance criterion or invariant needs, following the project's test style, and it reports every test it adds.

## Use when

- A change is implemented and needs evidence before review, merge, or a report
- After a fix, to re-verify what the fix affects
- The user asks whether something works

## Inputs

- **The change:** a base commit (default: the uncommitted change plus the current branch's commits), or a commit range
- **The intent:** acceptance criteria, or the request they come from
- **Optional:** an impact map and verification plan from `plan-change`, the effort profile, and checks already run with their results. Rerun a check only when the code it covers changed after it ran.

## Procedure

### 1. Map the impact

Read the diff (`git diff <base>`, plus untracked files). Complete the impact map from `references/operating-rules.md`, or check the one you were given against the diff. Trace outward only as far as the change reaches:

- **Contracts:** for each changed route, schema, exported type, event, config key, or env var, search for its consumers
- **Data flow:** follow changed data from where it enters to where it is stored and shown
- **Runtime:** find which processes run the changed code and how they start

### 2. Select the checks

Map and select for every change, however small: a one-line change to a page still needs that page checked in a browser. These rules always apply:

| The change touches | Always select | Never select, without another reason |
| --- | --- | --- |
| A page or component | A browser check of each page that renders it | Database checks |
| Backend logic or validation only | Tests and API checks for each changed route | Browser checks |
| An API contract | Producer tests, plus checks for every consumer, including the pages that render it | Checks for consumers that do not use the changed part |
| A migration | Up, down, and up on a disposable database, plus the queries that use it | Browser checks |
| Auth, money, or other high-risk areas | The invariants in `references/invariants.md` | — |

Use `references/impact-checks.md` for everything else. Every selected check needs a reason in the impact map. Every check you do not run, among those a reader might expect, goes on the skipped list with its reason. When the change crosses a trust boundary, add the checks from `references/security.md` it calls for. When it is high-risk, add the invariants from `references/invariants.md`.

### 3. Find the tooling

Use the project's own commands, as `references/verification.md` describes. Prefer existing tests, fixtures, and scripts. If a needed tool is missing, such as a browser driver or a test database, follow "Missing tooling" in `references/runtime-checks.md`.

A project without browser tooling still gets its browser checks. Run the Playwright CLI with `npx -y @playwright/cli` from a scratch directory, as `references/runtime-checks.md` shows; it changes nothing in the project. Report a browser check as not run only after that attempt fails, and quote the error.

### 4. Run, narrow to broad

1. Static checks on the changed packages: format, lint, type check
2. Targeted tests for the changed code and each acceptance criterion
3. Tests you add for criteria or invariants that have no coverage
4. Integration checks along the impact map: API calls, migrations, consumers
5. Runtime checks: start what the impact reaches and exercise it (`references/runtime-checks.md`)
6. Broader suites, when the profile or the impact calls for them

Stop widening once every selected check has run. If a check reveals a dependency missing from the impact map, add it, select its checks, and continue. Extend the map once; if it keeps growing, report that the change is wider than planned.

### 5. Handle failures

Diagnose each failure to its cause: run the narrowest command, then compare with the baseline in `references/verification.md`. Decide whether the change caused it. Report it as a finding in the format from `references/operating-rules.md`. Do not fix product code here.

## Output

```text
Impact       API (POST /refunds, webhook), payments table, order page; no other consumers of RefundResult
Checks       ✓ npm run typecheck
             ✓ npm test -- refunds   23 passed (4 new: cap, idempotency, unsigned webhook, concurrent refunds)
             ✓ migration up, down, up on a disposable SQLite file
             ✓ curl POST /refunds as non-owner → 403
             ✗ browser: refund dialog shows no error when the provider fails (finding below)
Skipped      Product listing and search pages: they do not use payment data
Not run      Provider sandbox: no sandbox key; the provider client is faked in tests
Findings     Medium  web/OrderPage.tsx:88  Provider error is swallowed; dialog closes as if it succeeded
Status       Needs attention
```

## Escalate

- A required check cannot run (missing service, credentials, or a dependency the user must approve): report it as not run and stop claiming full verification
- A failure comes from the environment or existed before the change: report it, and do not treat it as caused by the change

## Hand off

- Findings go back to the implementer: `implement-feature`, or `hungry-jack` when it called this skill
- When an independent check is wanted, the evidence record goes to `review-changes`

Before you finish, check your list of available skills for each skill named in this section. If any is missing, end your report with the missing names, this command, and the question "Should I install them for you, or will you install them yourself?" Follow "Missing companion skills" in `references/operating-rules.md` for the rest.

```bash
npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
```

## Done when

Every acceptance criterion and high-risk invariant has a check that ran and passed, or is listed as not run or failed with the reason. Every skipped check has a reason, and every process you started is stopped.
