---
name: simplify-code
description: Simplify recently changed code without changing its behavior. Removes unnecessary wrappers, speculative abstractions, redundant checks, dead code, and narrating comments, one change at a time, rerunning the affected checks after each. Use after implementing a change, when a diff feels heavier than the problem, or when asked to simplify, clean up, or reduce complexity in a change.
---

# Simplify Code

Make a change as plain as the problem allows, so that another engineer can read it quickly and trust it. Behavior stays identical. Fewer lines is a side effect, never the goal; clarity beats brevity.

Read `references/operating-rules.md` and `references/code-quality.md` first.

## Use when

- A change is implemented and its checks pass
- The diff shows complexity signals: new wrappers or layers, single-use helpers or interfaces, options nobody passes, defensive checks for impossible states, duplicated logic, deep nesting, or comments that narrate

Skip it when the diff is small and already plain.

## Inputs

- **Scope:** the change against a base commit (default: the uncommitted change plus the current branch's commits). Never the whole repository unless the user asks.
- **Checks:** the commands that cover the changed code, from `verify-work` or the project. Without passing checks, there is nothing to preserve behavior against; get them first.

## Procedure

1. **Read the whole change** with its surrounding code and the project's patterns. Simplification means fitting the codebase, not a personal style.
2. **List the candidates.** For each, name the signal from `references/code-quality.md` and the simpler form. Drop any candidate that would change behavior, a public interface, or code outside the scope.
3. **Apply one at a time.** After each, rerun the checks that cover it. If any fails, revert that simplification, and do not retry it.
4. **Stop** when no candidate remains that makes the code clearer. Do not cycle on taste.

Typical simplifications:

- Inline a wrapper or single-use helper that only moves code around
- Remove an interface, factory, or option with one implementation or caller
- Delete validation that earlier validation or the types already guarantee
- Replace nested conditionals with guard clauses
- Reuse an existing helper instead of a new duplicate
- Remove dead code, unused exports, debug output, and narrating comments

## Output

```text
Simplified   Inlined formatRefundPayload (one caller); removed RefundOptions (no caller passed options);
             dropped a null check already guaranteed by the schema (refund-service.ts:31)
Kept         RefundError subclass: matches the project's error-handling convention
Checks       ✓ npm test -- refunds (23 passed)  ✓ npm run typecheck   rerun after the last edit
```

## Escalate

- The clearest form needs a behavior or interface change: report it as a suggestion, and do not apply it
- The simplification would reach code outside the scope: report it, and do not apply it

## Hand off

Return the simplified change, and the checks rerun, to the caller: `hungry-jack`, or the user. If the simplification touched code covered by browser or integration checks, say which ones should be rerun.

Before you finish, check your list of available skills for each skill named in this section. If any is missing, end your report with the missing names, this command, and the question "Should I install them for you, or will you install them yourself?" Follow "Missing companion skills" in `references/operating-rules.md` for the rest.

```bash
npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
```

## Done when

Every applied simplification has passing checks rerun after it, no behavior or interface changed, and nothing outside the scope was touched.
