---
name: reflect
description: Learn from a demonstrated engineering failure, such as a failed test, a confirmed review defect, a repeated mistake, a manual correction, or a regression. Finds the root cause, decides whether it is systematic, and proposes the smallest durable prevention (a test, lint rule, or tooling first; an instruction change last), validated against real examples. Never changes instructions or skills without explicit approval. Use when the same kind of mistake recurs, a defect escaped existing checks, or the user asks to learn from a failure.
---

# Reflect

Turn a real failure into a prevention that will catch the next one. Learn only from what was demonstrated: a failing check, a confirmed defect, or a correction. Never learn from assumptions or style preferences.

Read `references/operating-rules.md` first.

**Reflect proposes; it never applies.** Do not edit `AGENTS.md`, `CLAUDE.md`, skills, memory, lint configs, CI, or any other persistent rule until the user explicitly approves that specific change.

## Use when

- The same kind of defect or mistake happened twice
- A defect reached review or the user that an automated check could have caught
- A fix loop hit its limit
- The user corrected the work, or asks to learn from a failure

Do not run after a clean, successful task.

## Inputs

- The failure, with its evidence: a failing test output, a confirmed finding, the user's correction, or the regression
- The change it occurred in

## Procedure

1. **State the failure.** One sentence of what went wrong, with the evidence that shows it. With no evidence, stop: there is nothing to learn yet.
2. **Decide whether it is systematic.** Look for the same pattern elsewhere: in other occurrences in the code (`git grep`), in `git log`, and in earlier findings in the findings log when one exists. One isolated slip is not systematic: report it and stop.
3. **Find the root cause.** Ask why until you reach something that a check, a tool, or an instruction could change: a missing test category, a rule the linter could enforce, an instruction that was ambiguous, or a step that was skipped.
4. **Propose the smallest durable prevention**, preferring in this order:
   1. A test that fails on the defect
   2. A static rule: a lint rule, type constraint, or schema
   3. Tooling: a script, CI step, or pre-commit check
   4. An instruction change, in the project's `AGENTS.md` or `CLAUDE.md` or in a skill, written as one precise rule
5. **Validate the proposal** against realistic examples: show it catches the original failure (the test fails, or the rule flags the code) and passes on correct code. Validate without changing the project: run a candidate test or rule from a temporary directory, or state the exact validation when it cannot run. For an instruction change, show the before and after text and the case it would have changed.
6. **Ask for approval**, with the exact diff of the proposed change.

## Findings log

When the user opts in, keep recurring findings in `docs/engineering-findings.md` in the project, one line each: date, pattern, where it was seen, and the prevention status. Create the file only after the user agrees. Use it to spot recurrence; it is not a rule set.

## Output

```text
Failure      Refund route accepted another tenant's payment ID (confirmed finding, refund.test.ts)
Systematic   Yes: the same unscoped findById in invoices.ts:31 and payouts.ts:18
Root cause   Repositories expose findById without a tenant parameter; nothing enforces scoping
Prevention   Lint rule banning PaymentRepository.findById outside repositories, plus scoped
             findForTenant(tenantId, id); validated: flags 3 current call sites, passes on the fixed ones
Proposed     (diff of the rule and the call-site changes)
Approval     Waiting for your approval. Nothing has been changed.
```

## Escalate

The prevention needs changes beyond the project, such as a shared skill or global instructions: propose them separately, and say who owns them.

## Hand off

Approved test, lint, or tooling changes go to `implement-feature`. Approved instruction changes are applied exactly as approved, and nothing more.

Before you finish, check your list of available skills for each skill named in this section. If any is missing, end your report with the missing names, this command, and the question "Should I install them for you, or will you install them yourself?" Follow "Missing companion skills" in `references/operating-rules.md` for the rest.

```bash
npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
```

## Done when

The failure is shown to be isolated, or a validated prevention is proposed and is waiting for approval, or was applied as approved.
