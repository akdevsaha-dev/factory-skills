---
name: review-changes
description: Review a code change independently for correctness, security, contract safety, test adequacy, and maintainability, reporting only evidence-backed findings with exact locations and failure scenarios. Use before merging or handing off a change, for high-risk changes, or when asked to review a diff, branch, commit, or pull request.
---

# Review Changes

Review a change as a strict senior engineer who did not write it. Find real defects and say exactly how each one fails. A short list of confirmed findings is worth more than a long list of opinions.

Read `references/operating-rules.md` and `references/code-quality.md` first. Read `references/security.md` when the change crosses a trust boundary.

This skill does not modify code. It reports.

## Use when

- A change is ready and needs an independent check before handoff or merge
- The change is high-risk by the tiers in `references/operating-rules.md`
- The user asks for a review

## Inputs

- **The change:** a base commit or range (default: the uncommitted change plus the current branch's commits), or a pull request
- **The intent:** acceptance criteria, or the request
- **Optional:** an impact map and an evidence record. Use them to know what was checked, not as proof that it works.

When called for an independent review, work only from these inputs and the code, not from the implementer's account of it.

## Procedure

1. **Read the whole diff**, including untracked files, and the code around every hunk. Read callers of changed functions and consumers of changed contracts.
2. **Check each acceptance criterion** against the code: is it implemented, on every path, including failures?
3. **Look for defects:**
   - Correctness: edge cases, error paths, off-by-one, null handling, ordering, transactions, races
   - Contracts: callers and consumers that the change breaks
   - Security: the checklist in `references/security.md` for each boundary crossed
   - Tests: does each criterion have a test that would fail without the change? Are failure paths covered?
   - Maintainability: the review checklist in `references/code-quality.md`, judged against the project's own conventions
4. **Confirm each finding.** Trace the failing path in the code, or demonstrate it with a test or command when you can. A finding without a concrete failure scenario is a question, not a defect.
5. **Rank** by severity, and drop style preferences the project does not hold.

On a re-review after fixes, read only the changed hunks and the code they affect, and confirm that each earlier finding is resolved.

## Output

Findings in the format from `references/operating-rules.md`, most severe first, each marked confirmed or plausible. Then one line per acceptance criterion (met, not met, or unverified), and a verdict:

```text
Criteria     1 met  2 met  3 not met (webhook replay)  4 met
Verdict      Changes needed: 1 High, 1 Medium
```

When nothing survives confirmation, say so plainly.

## Escalate

- The change does something the request did not ask for, or contradicts the plan: report it as a finding
- A finding is High severity and plausible but unconfirmed: report it, with what would confirm it

## Hand off

Return the findings to the caller: `hungry-jack`, which fixes the confirmed ones, or the user.

Before you finish, check your list of available skills for each skill named in this section. If any is missing, end your report with the missing names, this command, and the question "Should I install them for you, or will you install them yourself?" Follow "Missing companion skills" in `references/operating-rules.md` for the rest.

```bash
npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
```

## Done when

Every changed file was read, every acceptance criterion has a verdict, and every finding has a location, a failure scenario, and a confirmation status.
