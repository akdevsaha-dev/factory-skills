---
name: hungry-jack
description: Deliver substantial engineering work end to end like a disciplined senior engineer. Plans only as much as the task needs, implements the smallest correct solution, verifies by actual impact, and reviews when risk justifies it. Use for large or high-risk work spanning several modules or systems, such as multi-system features, payments and financial workflows, matching or recommendation systems, onboarding and authorization, background jobs and integrations, or architectural changes. Accepts --effort snack, balanced (default), feast, or banquet. For a small, contained change, use implement-feature instead.
---

# Hungry Jack

Take a substantial engineering task from request to a review-ready change. Hungry Jack does not write code or tests itself; it decides which work the task needs and runs the companion skill for each phase:

| Phase | Skill | Must be installed |
| --- | --- | --- |
| Plan | `plan-change` | Yes |
| Implement | `implement-feature` | Yes |
| Verify | `verify-work` | Yes |
| Simplify | `simplify-code` | Yes |
| Review | `review-changes` | Yes |
| Learn | `reflect` | No |

On every route, whatever the profile:

- Code changes are made through `implement-feature`.
- Verification is done by `verify-work`. Checks you run on your own, outside it, support it but never replace it.

Run each phase by invoking its skill with your environment's skill mechanism (in Claude Code, the Skill tool), even when you could do the work yourself. The skills hold the check matrices, invariants, and checklists that this file deliberately does not repeat, so doing a phase from memory skips them. Its instructions govern that phase, and control returns here at its handoff. Skip a phase only where this workflow allows it, and name the skip in the report. Never invoke `hungry-jack` from inside a phase.

## Start

1. **Parse the request.** Take `--effort` from the arguments (`snack`, `balanced`, `feast`, or `banquet`; default `balanced`). Ask about any other value. The rest is the task.
2. **Check the companions.** If a required skill is not available, stop before any other work. Name the missing skills, show the install command and the repository, and ask whether to run it for the user or whether they will install manually:

   ```bash
   npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
   ```

   https://github.com/akdevsaha-dev/factory-skills

   Wait for the answer. If they want you to install, run the command, adding `-g` when Hungry Jack itself is installed globally (under the home directory, not the project). Then confirm the new skills are available; if they are not, ask the user to reload skills or restart the session, then run `/hungry-jack` again. If they will install manually, stop here.

3. **Read `references/operating-rules.md`.** It defines safety, evidence, risk tiers, the impact map, findings, and loop limits for every phase.
4. **Record `git status`.** Changes that are already there belong to the user.

Keep a short ledger in your working notes, not in a file: acceptance criteria, impact map, decisions, every check run (command, result, and what it covered), and open issues. Check it before investigating, planning, or running anything, so that no work is done twice.

## Effort profiles

Profiles set how much optional work to do. They never remove a requirement of the task's risk tier, an acceptance criterion's verification, or a security check for a trust boundary the change crosses. They do not change the model or its thinking effort.

| | `snack` | `balanced` | `feast` | `banquet` |
| --- | --- | --- | --- | --- |
| Plan | A few lines inline; `plan-change` only for high-risk work | `plan-change`, proportional to the task | `plan-change` with a deeper architecture assessment | `plan-change` with failure modes and security boundaries for every slice |
| Verify | `verify-work` on direct impact | `verify-work` on direct impact plus affected integrations and runtime paths | Also the full suites of affected packages and every consumer of changed contracts | Also important failure scenarios and extra evidence for high-risk invariants |
| Simplify | Only when the diff shows a clear complexity signal | When the diff shows complexity signals | On every non-trivial diff | On every non-trivial diff |
| Review | `implement-feature`'s self-review; `review-changes` for high-risk work | `review-changes` when the change is high-risk or large | `review-changes` by an independent reviewer | Independent correctness review and independent security review |
| Subagents | None beyond `implement-feature`'s own search | Only for an independent reviewer or a broad search, when useful | Independent reviewer; a specialist only with a stated reason | Up to two reviewers; no other routine subagents |
| Report | A few lines | Standard | Standard | Standard, with the evidence for each high-risk invariant |

Use a subagent only where your environment supports one. Without one, do the phase in this conversation and say so in the report.

## Step 1: Understand

Restate the intended behavior as acceptance criteria: inputs, outputs, who may do it, what the user sees, and what happens on failure. Ground each term in the code. Ask only when interpretations differ in ways that affect correctness, security, data, or architecture, and ask everything at once.

## Step 2: Scope

Read only what decides the route: project instructions (`AGENTS.md`, `CLAUDE.md`), the stack, the entry points the task names, and the nearest analog. Draft the impact map and the risk tier from `references/operating-rules.md`.

Choose the route:

- **Contained after all:** standard risk, one module, no contract change, and no trust boundary. Say so, then run Step 4 with the whole task as one slice, then Step 5 (verify) and Step 11 (report). Skip the other steps.
- **Substantial:** continue.

## Step 3: Plan

Run `plan-change` unless the profile allows an inline plan and the work is standard-risk. Give it the acceptance criteria, the impact map draft, the effort profile, and what you have already read. It returns ordered slices, a completed impact map, and a verification plan.

High-risk work needs plan approval before any edit, in every profile, as `references/operating-rules.md` defines. Show the plan and wait, unless the request waives the wait as that file allows.

## Step 4: Implement

Run `implement-feature` once per slice, in dependency order. Hand it the slice, its acceptance criteria, and the approved plan, and tell it:

- The plan is approved. Skip its Step 3 plan and its approval wait.
- Keep its other steps, including the baseline checks in its Step 2, its verification of the slice, and its self-review.
- Skip its Step 7 report. Record the files changed, the checks it ran with their results, and anything it noticed in the ledger.

A phase's handoff is a ledger note, not a message to the user. Do not end your turn between phases: when a phase finishes, invoke the next one right away. The only messages that end your turn are a question the task cannot proceed without, a plan waiting for approval, and the Step 11 report.

Record its check results in the ledger. If a slice reveals a dependency the plan missed, update the plan with `plan-change`, within the loop limits, and get approval again for high-risk work.

## Step 5: Verify

Run `verify-work` on the whole change. Hand it the acceptance criteria, the impact map, the verification plan, the effort profile, the base commit, and the checks already run with their results, so it reruns nothing whose inputs are unchanged. It selects checks by impact, runs them, and returns an evidence record, including failures as findings.

## Step 6: Simplify

Run `simplify-code` on the change when the profile calls for it, with the base commit and the checks from the evidence record. It preserves behavior and reruns the checks it can. Rerun any others it names through `verify-work`. Skip it for a small, already plain diff, and note the skip.

## Step 7: Review

Run `review-changes` when the profile or risk tier calls for it.

For an independent review, give a subagent `review-changes` with only the base commit, the acceptance criteria, the impact map, and the evidence record. Do not pass your reasoning about the implementation; the value of the review is a reading that is not anchored on yours.

## Step 8: Fix

Fix only confirmed findings and failed checks. Run `implement-feature` with each fix as the slice, as in Step 4, for the smallest change that removes the cause. Then run `verify-work` on what the fix affects, plus the checks that had failed. Re-review only the changed hunks. Follow the loop limits in `references/operating-rules.md`, and escalate instead of retrying past them.

## Step 9: Final gate

Read the complete final diff, including untracked files. Confirm that:

- Every acceptance criterion has passing evidence, or is listed as unverified
- Every check `verify-work` selected ran. Run any that was skipped but can run here. Only a check that cannot run in this environment may stay as not run, and it makes the status `Needs attention`
- Every requirement of the risk tier is met
- Checks ran after the last change to the code they cover
- There are no unintended changes: unrelated edits, debug output, or changes to the user's pre-existing work

## Step 10: Reflect

Run `reflect` only when something systematic happened: the same kind of defect appeared twice, a defect escaped to review that a project check could have caught, a loop limit was hit, or the user corrected the work. Skip it after a clean run. Its proposals wait for the user's approval.

## Step 11: Report

```text
Implemented            Refunds: partial and full refunds from the order page, through the provider's
                       refund API, with a webhook that marks the refund settled.

Engineering decisions  Refund state lives on the payment row (refunded_cents), matching captured_cents;
                       no separate ledger table.

Verification           ✓ typecheck  ✓ lint  ✓ 48 API tests (9 new)  ✓ migration up/down on a disposable DB
                       ✓ invariants: refund ≤ captured, idempotency key, webhook signature, concurrent refunds
                       ✓ browser: refund dialog, error state, no console errors

Skipped                Load testing (no load-test setup in the project)

Risks                  Provider sandbox not called; the client is faked in tests

Status                 Ready for review
```

Keep it as short as the task allows. List only checks that actually ran, and set the status as `references/operating-rules.md` defines.
