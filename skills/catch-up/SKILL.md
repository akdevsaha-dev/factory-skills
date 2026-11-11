---
name: catch-up
description: Explain what teammates changed in a shared Git repository since you last worked in it. Finds your last commit as the baseline, reads the real diffs and surrounding code, groups changes by feature, and flags what affects your current work, breaking changes, migrations, risks, and what to review. Read-only. Use when the user asks to catch up, what changed, what happened while they were away, what teammates did, what landed on main, or what a pull would bring in.
---

# Catch Up

Explain what happened in the repository since the user last looked, the way a senior teammate would brief them: grouped by feature, grounded in the actual code, and focused on what affects their work and what deserves a closer look.

## Ground rules

- **Read-only.** Never modify the working tree, the index, refs, or history. No fetch, pull, merge, rebase, checkout, switch, stash, reset, commit, or file edits, not even temporarily. `references/git-history.md` lists the safe commands. The only write is `save`, and only when the user asks for it.
- **Never fetch on your own.** Remote analysis uses the remote-tracking refs as they are. Fetch only when the user explicitly asks for it in this conversation.
- **The diff is the evidence.** Commit messages, PR titles, and branch names are claims to check against the code, never the source of a finding.
- **Count each change once.** Describe the net change of the range. Use individual commits only for attribution, grouping, and intent.
- **Separate fact from inference.** Label what the code shows as confirmed and what you deduce about intent or impact as inferred.
- **Cite locations.** Point to `path:line` in the target version for every specific claim.
- **Signal over completeness.** Group related work, collapse trivial changes into one line, and skip what does not matter.

## Options

Parse these from the arguments or plain words ("since Monday", "only Bob's changes"). They combine; for example, `/catch-up deep remote author bob`.

| Option | Effect |
| --- | --- |
| `quick` (default) | High-signal changes read in full, everything else skimmed |
| `deep` | Every meaningful diff read with surrounding code, callers, tests, and merge resolutions |
| `remote [<ref>]` | Analyze the remote-tracking branch (the upstream by default) instead of local `HEAD` |
| `since <commit, ref, or date>` | Baseline is that commit, or the last commit before that date |
| `last <N>` | Baseline is N changes back on the target's first-parent line |
| `checkpoint` | Baseline is the checkpoint saved for this branch |
| `author <name or email>` | Only changes authored by that person |
| `save` | After reporting, save the analyzed commit as this branch's checkpoint |

## Step 1: Resolve the range

Read `references/git-history.md`, then determine:

1. **Your work.** Current branch, `HEAD`, uncommitted changes, and local commits not on the upstream. Read uncommitted changes only with the commands in "Your uncommitted work" in the reference; a plain `git diff` rewrites the index.
2. **Target.** Local `HEAD`, or with `remote`, the remote-tracking ref, its last fetch time, and how far local is ahead and behind. In local mode, still note in one line when the upstream has commits that local lacks.
3. **Baseline.** An explicit `since`, `last`, or `checkpoint` wins. Otherwise use your most recent authored commit reachable from the target, matched by your Git identity. Unpushed commits are not reachable from a remote target, so in remote mode the baseline is your last commit that the remote has.
4. **Range.** All commits from the baseline to the target, with the `author` filter applied.

Show the resolved range before the analysis, and continue without waiting:

```text
Catch-up  main · local HEAD 8e41a2c · quick
Baseline  51c09fd "Add order export", your last commit (4 days ago)
          Override with: since <ref or date>, last <N>, checkpoint, author <who>
Range     14 commits in 5 changes by Priya Shah, Tom Okafor · 23 files, +612 −148
```

When the range is empty, show the header with `Range  empty` and stop. Then say whether the remote-tracking branch has commits that local lacks, as of its last fetch (suggest `/catch-up remote`). When no baseline can be found, say why and offer `since` or `last` with a suggested value.

## Step 2: Map the history

Follow "Count each change once" in `references/git-history.md`:

1. List the **units of change**: the target's first-parent commits in the range. Each is a direct commit, a squash merge, or a merge commit whose branch is one unit.
2. Take the **net diff** from baseline to target, with rename detection, as the single account of what is now different.
3. Note **reverts** and changes added and reverted inside the range, **duplicates** from cherry-picks or rebases, and **merges with manual resolutions**.

## Step 3: Read the changes

Read `references/review-guide.md`. Classify every changed file as high-signal, ordinary, or generated. Then read by mode:

| | `quick` | `deep` |
| --- | --- | --- |
| High-signal files (migrations, contracts, routes, exported interfaces, auth, config, dependencies, CI, deletions) | Full diff, plus the surrounding code at the target | Same |
| Ordinary files | Stat and hunk headers; open a hunk when its context suggests it matters | Full diff with surrounding code |
| Consumers of changed interfaces | `git grep` at the target for callers of changed or removed symbols | Trace callers and callees through the code |
| Merge commits | Resolution check on merges that touch high-signal files | Resolution check on every merge |
| Tests | Whether behavior changes came with tests | Read the tests and judge what they cover |
| Generated files and lockfiles | Lockfiles only, to confirm versions | Same |

Read code at the target with `git show <target>:<path>`. Never check out. In `deep` mode on a large range, hand each feature group to a read-only subagent if your environment has one, and keep only its conclusions.

When the range is large (hundreds of commits or thousands of changed lines), keep `quick` to the high-signal files, summarize the rest by area, and suggest narrowing with `since`, `last`, or `author`.

## Step 4: Group by feature

Cluster the units and files into feature groups: one user-facing capability or one technical concern each (for example "rate limiting on user lookups", not "Bob's commits"). A unit that does two unrelated things belongs to two groups, and several units that build one thing form one group.

For each group, record what changed (confirmed), why it was likely done (inferred), who did it, the units involved, and the key locations. Cover the change types in `references/review-guide.md`: architecture, API contracts, migrations, dependencies, refactors, and removed functionality.

## Step 5: Assess impact on your work

Follow "Impact on your work" in `references/review-guide.md`. Check:

- **Textual conflicts.** In remote mode, your unpushed commits against the remote, using the isolated merge check in `references/git-history.md`. Your uncommitted files against the range's files, by comparing hunks.
- **Semantic breaks.** Your code calling an interface that changed, a file you edit that moved, migrations that collide with yours, new required configuration, and dependencies you need to install.

In local mode the range is already in your `HEAD`, so the question is whether your uncommitted work still fits it. In remote mode the question is what a pull or rebase would bring and break.

With `author`, assess only that person's changes, but if something outside the filter breaks your work, add one line saying so.

## Step 6: Find risks

Look for potential bugs, security concerns, breaking changes, and missing verification, using the checklists in `references/review-guide.md`. Report a risk only with a concrete location and a scenario in which it goes wrong. Rate each risk High, Medium, or Low by its likely impact. When it depends on something you cannot see, such as the production schema or an entry point outside the repository, say so in the finding.

## Step 7: Report

Lead with a short summary, then important changes, then impact, then what to review. Keep it scannable. Do not narrate commits one by one.

```text
Catch-up  main · local HEAD 8e41a2c · quick
Baseline  51c09fd "Add order export", your last commit (4 days ago)
Range     14 commits in 5 changes by Priya Shah, Tom Okafor · 23 files, +612 −148

Summary
  Checkout now creates a payment intent before saving the order, and order totals are stored in
  cents, with a migration that rewrites existing rows. The server now requires STRIPE_WEBHOOK_SECRET.
  Your uncommitted export code still reads the removed order.total field.

Important changes
  1. Payments move to intents (Priya Shah, merge 8e41a2c, #88)
     Confirmed  createOrder() calls payments.createIntent() before saving (src/orders/service.ts:42)
     Confirmed  New POST /webhooks/stripe verifies the signature (src/webhooks/stripe.ts:12)
     Confirmed  src/config.ts:18 throws when STRIPE_WEBHOOK_SECRET is unset; src/server.ts:3 imports it
     Inferred   Payment confirmation becomes asynchronous, so orders can stay pending
  2. Order totals in cents (Tom Okafor, squash 3fa90b1, #91)
     Confirmed  Order.total (decimal) replaced by totalCents (integer) (src/orders/model.ts:9)
     Confirmed  Migration rewrites every row in place, with no down migration (db/migrations/0042_total_cents.sql:3)
  3. Smaller: logger moved to src/lib/log.ts; eslint upgraded to v9 (config rewritten, same rules)

Impact on your work
  ✗ src/orders/export.ts:27 (uncommitted) reads order.total, which no longer exists (src/orders/model.ts:9)
  ✗ db/migrations/0042_export_log.sql (untracked) has the same number as 0042_total_cents.sql
  ! Set STRIPE_WEBHOOK_SECRET locally or the server will not start
  ✓ No textual overlap with your other uncommitted changes

Review
  1. High    src/webhooks/stripe.ts:30  marks the order paid without comparing the event amount to the order
  2. Medium  db/migrations/0042_total_cents.sql:3  one UPDATE over all orders holds a table lock
  3. Low     src/orders/service.ts:42  the new pending state has no tests

Not checked  CI results; whether production sets STRIPE_WEBHOOK_SECRET
```

In remote mode, the header gains the local and remote state, `Range` covers the whole range, and `Split` divides it. Mark each change `· already local` or `· remote-only` after its title:

```text
Catch-up  main · remote origin/main 8e41a2c · deep
Local     main @ 22a29fb · 1 ahead, 4 behind origin/main · 2 uncommitted files
Remote    origin/main @ 8e41a2c · last fetched 2 hours ago (not fetched now)
Split     1 change already local · 4 remote-only
```

With `author`, `Range` shows that person's commits and their diff stats, followed by the whole range's counts in parentheses. With `last <N>`, the `Baseline` line reads `<sha>, last N changes (a merged branch counts as one)`.

Omit empty sections. If you saved a checkpoint, end with the ref you wrote.

## Checkpoints

A checkpoint records where you last caught up, so the next run can start there. Save one only when the user asks (`save`), after the report, using the commands in "Checkpoints" in `references/git-history.md`. Tell the user the ref you wrote and how to delete it.

The checkpoint marks the whole range as seen. After an `author`-filtered run, other people's changes were not reviewed, so say that and ask before saving. If the user still wants it, record the filter in the checkpoint's message, and repeat that warning whenever the checkpoint is used.
