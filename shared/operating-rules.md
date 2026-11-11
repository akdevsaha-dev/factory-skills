# Operating rules

Rules shared by `hungry-jack` and its companion skills: `plan-change`, `verify-work`, `simplify-code`, `review-changes`, and `reflect`. They hold for every task and every effort profile.

## Safety

- **Respect the working tree.** Record `git status` before you start. Never modify, revert, stage, or stash changes that were already there, and make no edits outside the task.
- **Baselines.** Run baseline checks before you edit. To check the original code later, use a temporary worktree of the base commit (`git worktree add`, then `git worktree remove`). Never use `stash`, `checkout`, `reset`, or `restore` on the working tree for it.
- **Git.** Commit or push only when asked. Never rewrite history or force-push, and never merge, deploy, or release without explicit authorization.
- **Environments.** Run against local or disposable databases and services only. Never touch production data or infrastructure, use real payment credentials or real customer data in tests, or call real external endpoints (email, webhooks, payment providers) without approval. Use the provider's test mode or the project's fakes.
- **Dependencies.** Prefer tooling the project already has. Ask before adding a dependency or dev tool to the project, including test frameworks and browser tooling.
- **Side effects of checks.** Write tool artifacts (screenshots, traces, `.playwright-cli/`) outside the repository or delete them. Stop every server and process you start.

## Missing companion skills

Every companion works on its own; a missing companion never blocks your own work. When your work is done and its handoff names a skill that is not installed, end your report by offering the full Hungry Jack set:

```bash
npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
```

Show the command and https://github.com/akdevsaha-dev/factory-skills, and ask whether to run it for the user or whether they will install manually. Run it only when they say yes, adding `-g` when your own skill is installed globally (under the home directory, not the project). Then confirm the skills are available; if they are not, ask the user to reload skills or restart the session. Offer this at most once per session.

## Evidence

- A check counts only if it ran in this session, after the last change to the code it covers, and passed. Record the command and its result.
- Never fabricate, assume, or extrapolate a result. When tooling or infrastructure is missing, report the check as not run, say why, and give the command that would run it.
- Label what the code or a check shows as confirmed, and what you deduce as inferred.
- End with a status: **Ready for review** (every gate has evidence), **Needs attention** (works, but something is unverified or a risk remains), or **Blocked** (cannot proceed without the user).

## Risk tiers

Assess risk from the change itself, never from the effort profile or the number of files.

| Tier | Includes | Requires |
| --- | --- | --- |
| Standard | Feature code inside existing boundaries, internal refactors, UI without new data access | The normal workflow |
| High-risk | Authentication and authorization; how money is calculated, charged, refunded, or recorded; migrations on existing data; data deletion; breaking public API or schema contract changes (removed or renamed fields, changed types or meaning); concurrent writes; background jobs or integrations with external side effects; secrets and personal data; tenant isolation | Plan approval before editing, the domain invariant checks in `verify-work`, and `review-changes` before completion |

Stricter input validation in front of a high-risk area is standard risk, unless it changes what is charged or who may act.

In every effort profile, each acceptance criterion, each trust boundary the change crosses, and each high-risk invariant needs a check.

**Plan approval.** Show the plan and wait for the user's approval before the first edit. If the request itself explicitly says not to wait, show the plan and continue. That waiver never covers production systems, real money, or destructive data changes; those always wait.

## Impact map

The shared description of a change, produced by `plan-change` or `verify-work` and read by `verify-work` and `review-changes`. Every line names concrete items or says `none`. A `none` is a claim to check, not a default.

```text
Change       Behavior that changes, in one sentence
Modules      Files or modules that change
Contracts    APIs, schemas, exported types, events, config keys, env vars (additive | behavior | breaking)
Consumers    Who depends on those contracts: pages, services, jobs, external clients
Data         Tables, migrations, queries, caches
Runtime      Processes that run the changed code: API server, worker, web app, scheduled job
Boundaries   Trust boundaries crossed: user input, auth, money, webhooks, tenants, external services
Risk         standard | high-risk, with the reason
```

## Findings

Report every defect, from verification or review, in this shape:

```text
High  src/billing/refund.ts:42  Refund amount is not capped at the captured amount
      Fails when: a partial capture of 50.00 is refunded for 80.00; the provider call succeeds in test mode
      Evidence: confirmed by test refund.test.ts "caps refund at captured amount" (fails)
```

Severity is High (security, data loss, money, outage), Medium (wrong behavior, broken contract), or Low (fragile or unclear). Only confirmed findings are fixed. Plausible ones are reported as questions.

## Bounded loops

- Run at most two fix rounds per task, each fixing every confirmed finding and failed check, then re-verifying. If anything still fails, stop and report the diagnosis.
- Re-plan at most once when work reveals an unknown dependency. A second surprise is escalated to the user.
- Never repeat a review or verification whose inputs have not changed. After a fix, rerun only the checks that cover what changed, plus any check that had failed.
- Companion skills never invoke `hungry-jack`, and they do not invoke each other except through the handoffs their own instructions name.
- A subagent never starts `hungry-jack` or spawns further subagents.
