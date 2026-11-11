# Hungry Jack usage guide

Hungry Jack takes substantial engineering work from request to a review-ready change. It decides which work the task needs, runs a focused skill for each phase, and reports only what it actually verified.

## Install

```bash
npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
```

`reflect` is optional. Hungry Jack stops and shows this command if a required companion is missing.

There are no runtime dependencies. Hungry Jack uses the checks your project already has: its test runner, linter, type checker, and build. For browser checks it prefers your Playwright Test suite, then a browser tool in your agent, then the Playwright CLI (`npx -y @playwright/cli`), run from a scratch directory. It asks before adding anything to your project.

## Commands

```text
/hungry-jack add refunds to orders
/hungry-jack --effort feast move invoice generation to a background job
```

Use `/implement-feature` for small, contained changes. When a task turns out to be small and standard-risk once inspected, Hungry Jack skips planning and review, and runs `implement-feature` and `verify-work`.

Every companion works on its own:

| Command | Use it to |
| --- | --- |
| `/plan-change` | Map the impact, risk, and slices of a change before building it |
| `/verify-work` | Choose and run the checks a change actually needs, and report the evidence |
| `/simplify-code` | Remove unnecessary complexity from a change without changing behavior |
| `/review-changes` | Get an evidence-based review of a diff, branch, or pull request |
| `/reflect` | Turn a repeated or escaped mistake into a test, rule, or instruction, with your approval |

## Effort profiles

`--effort` sets how much optional work Hungry Jack does. The default is `balanced`.

| Profile | Planning | Verification | Review | Subagents |
| --- | --- | --- | --- | --- |
| `snack` | Inline | Direct impact | Self-review | None |
| `balanced` | Proportional | Direct impact, integrations, runtime paths | When risky or large | Optional reviewer |
| `feast` | Deeper architecture | Wider regression and all consumers | Independent | Reviewer |
| `banquet` | Failure modes and security boundaries | Extensive, with extra evidence for high-risk invariants | Independent correctness and security | Up to two reviewers |

Profiles never skip required work. High-risk changes always need plan approval before editing, the domain invariant checks, and `review-changes`, even in `snack`. The high-risk list, and the one way to waive the approval wait, are in `skills/hungry-jack/references/operating-rules.md`.

## How a task flows

```text
Understand → Scope ─┬─ contained → implement-feature → verify-work → report
                    └─ substantial → plan-change → implement-feature (per slice) → verify-work
                                     → simplify-code? → review-changes? → fix and re-verify → final gate → report
```

- **Verification follows impact.** `verify-work` traces the diff through contracts, consumers, data, and runtime. A backend validation change gets backend tests and API checks; a component change gets component tests and a browser check; a migration gets migration checks on a disposable database. A browser check needs an affected page.
- **Loops are bounded.** Two fix rounds, one re-plan, and no repeated review of an unchanged diff. Past that, Hungry Jack stops and reports.
- **Learning needs approval.** `reflect` runs only after systematic failures, proposes a test, rule, or instruction change, and changes nothing until you approve it.

## Safety

Hungry Jack does not commit, push, merge, or deploy unless asked; never rewrites history or force-pushes; keeps your uncommitted changes intact; and runs checks only against local or disposable services, with test-mode payment credentials. The full rules are in `skills/hungry-jack/references/operating-rules.md`.

## Report

```text
Implemented            What changed
Engineering decisions  Only the important architectural choices
Verification           Checks that ran, with results
Skipped                Checks not run, and why
Risks                  What remains unresolved
Status                 Ready for review | Needs attention | Blocked
```
