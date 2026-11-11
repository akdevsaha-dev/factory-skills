# Git history

How to resolve the baseline and target, read history without changing anything, compare local with remote state, and count each change exactly once.

In the commands below, `B` is the baseline commit and `T` is the target commit.

## Read-only commands

Safe: `log`, `show`, `diff`, `rev-parse`, `rev-list`, `merge-base`, `grep` (with a tree-ish), `blame`, `cat-file`, `ls-tree`, `ls-files`, `for-each-ref`, `reflog show`, `config --get`, `check-attr`, `patch-id`, and the isolated merge check below.

- Run status as `git --no-optional-locks status`. Plain `git status` rewrites `.git/index`.
- Never compare against the working tree with porcelain `git diff` (`git diff`, `git diff HEAD`). It rewrites `.git/index`, even with a pathspec or `--no-optional-locks`. Use the commands in "Your uncommitted work". Diffs between two commits (`git diff B T`) are safe.
- Read files at the target with `git show T:path` and search them with `git grep -n <pattern> T -- <paths>`. Never check out a commit to read it.
- Run `git --no-pager <command>` or set `GIT_PAGER=cat` so nothing waits for input.

Never run: `fetch`, `pull`, `merge`, `rebase`, `cherry-pick`, `revert`, `checkout`, `switch`, `restore`, `reset`, `stash`, `commit`, `tag`, `push`, `branch` with changes, `worktree add`, `notes add`, `update-ref` (except `save`), `clean`, `apply`, `am`, `gc`, or `prune`. Do not run builds, installs, or tests either; they write to the working tree. Suggest the command instead.

`git show --remerge-diff` and the isolated merge check write no refs, index, or history, but Git may refresh the timestamps of existing object files. That is harmless.

### Isolated merge check

`git merge-tree --write-tree` predicts conflicts without touching the working tree, but it stores the merged result in the object database. Point it at a throwaway object directory so the repository gains nothing:

```bash
objects=$(git rev-parse --path-format=absolute --git-path objects)
scratch=$(mktemp -d)
GIT_OBJECT_DIRECTORY="$scratch" GIT_ALTERNATE_OBJECT_DIRECTORIES="$objects" \
  git merge-tree --write-tree --name-only HEAD T
rm -rf "$scratch"
```

Compute `objects` in its own command first, as shown. Exit code 0 means a clean merge. Exit code 1 means conflicts, and the conflicted paths are printed after the tree ID. It follows renames, so it catches an edit to a file that moved on the other side.

To check a file that merged cleanly for semantic problems, capture the tree ID (the first line of output), then read the file with `git show "${tree}:<path>"` and the same two variables set, before you delete `$scratch`.

### Your uncommitted work

```bash
git --no-optional-locks status --porcelain=v1 -uall   # which files: staged, unstaged, untracked
git diff-index -p -M HEAD -- <paths>                  # staged and unstaged changes against HEAD
```

`git diff-index` is plumbing and never writes the index. Take the file list from `status`, not from `diff-index --name-status`; the latter also lists files whose content is unchanged but whose timestamps differ. Read untracked files directly.

## Identity

```bash
git config --get user.email
git config --get user.name
```

Match the email exactly: `git log -1 -F -i --author='<me@example.com>' T`. The angle brackets and `-F` stop `.` and `+` from acting as regex characters. If the email matches nothing, try the name (`-F --author='Dev Me <'`), and say which one matched. If neither matches, ask whether the user commits under another email, such as a GitHub noreply address. If no identity is configured, ask for one or for an explicit baseline.

## Target

- **Local (default):** `HEAD`. A detached `HEAD` works; name the commit.
- **Remote:** a ref the user names, else the upstream (`git rev-parse --abbrev-ref '@{upstream}'`), else the remote's default branch (`git rev-parse --abbrev-ref origin/HEAD`). If there are several remotes and no upstream, use `origin` when it exists; otherwise ask.

For a remote target, also report:

- **Freshness:** `git reflog show -1 --date=relative --format='%gd %gs' refs/remotes/<remote>/<branch>`. If that prints nothing (no reflog), use the modification time of `FETCH_HEAD`. If neither exists, say "unknown". Always say the data is as of the last fetch and that you did not fetch.
- **Divergence:** `git rev-list --left-right --count HEAD...T` gives ahead and behind counts.

If the user asks you to refresh, run only `git fetch <remote>`. It updates remote-tracking refs and nothing else. Never follow it with a merge or rebase.

## Baseline

Resolve in this order. The first that applies wins:

| Source | Command |
| --- | --- |
| `since <ref>` | `git rev-parse --verify --quiet '<ref>^{commit}'` |
| `since <date>` (when not a ref) | `git rev-list -1 --first-parent --before='<date>' T` |
| `last <N>` | `git rev-parse --verify --quiet 'T~N'`. If the first-parent history is shorter, use the empty tree (`git hash-object -t tree /dev/null`) |
| `checkpoint` | `git rev-parse --verify --quiet refs/catch-up/<branch>` |
| Default | `git log -1 -F -i --author='<email>' --format=%H T` |

`last <N>` counts first-parent changes, so a merged pull request counts as one.

Then validate the baseline:

- **Not an ancestor of the target** (`git merge-base --is-ancestor B T` fails): this happens after a force push, or with a checkpoint or ref from another line of history. Use `git merge-base B T` as the effective baseline and say so.
- **Rewritten.** If the baseline's committer date (`%cd`) is more than a day after its author date (`%ad`), it was probably rebased, amended, or cherry-picked. Teammates' commits it was replayed onto then sit below it and fall outside the range. Warn, and suggest `since <author date>`.
- **Shallow clone** (`git rev-parse --is-shallow-repository` prints `true`): the baseline may be missing. Say so, and suggest `since` with a reachable commit. Do not deepen the clone; that is a fetch.

When you use the default baseline and a checkpoint exists for this branch, check whether the checkpoint descends from the baseline. If it does, it is a narrower starting point; mention it with its commit count.

## Count each change once

**Net diff is the record of what changed.** `git diff -M30% --stat --summary B T` for the overview, and `git diff -M30% B T -- <paths>` for content. It shows each line once no matter how many commits, merges, or reverts touched it. The 30% rename threshold catches small files that moved and changed, which Git's default of 50% reports as a delete and an add; a rename line's percentage shows how much changed. Always describe the final state, not the path taken to reach it.

**First-parent commits are the units of change:**

```bash
git log --first-parent --format='%h %p | %an | %ad | %s' --date=short B..T
```

| Parents | Unit | Its change to the target line | Its parts |
| --- | --- | --- | --- |
| One | Direct commit or squash merge | `git show <c>` | Itself |
| Two or more | Merge commit | `git diff <m>^1 <m>` | `git log <m>^1..<m>^2` |

Explain a merge's branch as one unit. Never explain both a merge's diff and its commits as separate changes. Still compare each part's diff with its message: a change hidden in a commit with an unrelated title is worth reporting.

**Patterns to recognize:**

- **Squash merges.** One commit, often titled with `(#123)`, whose body lists the original commits. The original branch commits are not in the range. If they also exist locally (on the user's branch, for example), `--cherry-mark` will not match them, because the patch differs.
- **Reverts.** `git log --grep='^Revert' B..T`. A change added and reverted inside the range has no net effect; mention it in one line. A revert of the baseline or of an earlier commit is a real change; explain what came back out.
- **Merge resolutions.** `git show --remerge-diff --format= <m>` shows edits made while resolving the merge that appear in neither parent. Empty output means a clean merge. Any output is worth reporting: it is code that no branch's review saw.
- **Duplicates.** When comparing two lines of history, `git log --cherry-mark --left-right --format='%m %h %s' HEAD...T` marks commits with the same patch on both sides with `=`. In `deep` mode, `git log -p B..T | git patch-id --stable` finds the same patch applied twice inside the range.
- **Pull merges.** In a range full of `Merge branch 'main' of ...` commits, the first parent can be a developer's local line. The net diff stays correct. Group by what the code does, not by which side of the merge it came from.

## Author filter

The net diff mixes everyone's work, so with `author` read that person's commits instead:

```bash
git log --no-merges -p -M30% -F -i --author='<name or email>' B..T
```

`--author` matches substrings, so `bob` also matches `Bobby`. List who matched (`git log --format='%an <%ae>' -F -i --author='<who>' B..T | sort -u`). If several different people matched, ask which one the user meant.

Also check co-authorship: `git log --no-merges -i --grep='Co-authored-by: .*<name>' B..T`. Git combines `--author` and `--grep` with AND, so run it as a second query and merge the results. A squash merge is attributed to the person who authored the squash commit. When you are unsure who actually wrote a change, say so.

Describe that person's changes. When a later commit in the range by someone else changed them, report the state at the target and say who changed it.

## Remote mode

Split the range into what the user already has and what is only on the remote:

| Set | Commits | Net diff |
| --- | --- | --- |
| Already local | `git log ^B $(git merge-base --all HEAD T)` | `git diff -M30% B $(git merge-base HEAD T)` |
| Remote-only | `git log B..T ^HEAD` | `git diff -M30% $(git merge-base HEAD T) T` |
| Local-only (your unpushed work) | `git log T..HEAD` | `git diff -M30% $(git merge-base HEAD T) HEAD` |

The remote-only diff is what a pull or rebase would bring in. Predict its textual conflicts with your unpushed commits using the isolated merge check (`HEAD` against `T`). Compare your uncommitted files with the remote-only files.

Cite remote code as `origin/main:path:line`, because the working tree does not have it.

## Checkpoints

A checkpoint is a private ref, `refs/catch-up/<branch>`, that points at the last commit the user caught up to. With a detached `HEAD`, ask for a name. It is not pushed by default, and `git log --decorate` does not show it.

```bash
# Read
git rev-parse --verify --quiet refs/catch-up/<branch>
git reflog show -1 --date=relative --format='%h %gd %gs' refs/catch-up/<branch>   # catch-up/main@{2 days ago} and the message

# Save (only on `save`, after the report): the target commit you analyzed
git update-ref --create-reflog -m 'catch-up checkpoint' refs/catch-up/<branch> T
# After an author-filtered run, record the filter: -m 'catch-up checkpoint (author: Bob Ruiz only)'

# Delete (tell the user)
git update-ref -d refs/catch-up/<branch>
```
