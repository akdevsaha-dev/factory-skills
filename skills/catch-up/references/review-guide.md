# Review guide

What to look for in the changes, how to judge their impact on the user's work, and how to report risks precisely.

## Classify the changed files

| Class | Typical paths | Treatment |
| --- | --- | --- |
| High-signal | Migrations and schema files; OpenAPI, GraphQL, protobuf, and JSON schemas; route and controller registration; exported modules and public types; auth, permissions, and middleware; config and env validation; `.env.example`; dependency manifests; toolchain versions (`.nvmrc`, `engines`, `go.mod`, `.python-version`); Dockerfiles, CI workflows, deploy configs; deleted files | Read the full diff and the code around it |
| Ordinary | Feature code, internal helpers, UI components, tests | Read by mode |
| Generated | Lockfiles, build output, vendored code, snapshots, minified files, generated clients, paths marked `linguist-generated` (`git check-attr linguist-generated -- <paths>`) | Do not review. Use lockfiles only to confirm resolved versions of direct dependencies |

The project's own layout decides what counts. A shared `types/` package or an SDK is high-signal even if this table does not name it.

## Change types

For each one, read the code. Do not rely on commit messages.

**Architecture.** New modules, layers, or services; responsibilities moved between them; new cross-cutting mechanisms (middleware, base classes, dependency injection, event buses); changed data flow. Look at `git diff --dirstat B T`, new top-level directories, and files that many others now import. Explain the new shape in a sentence or two: where code of a given kind now lives.

**API contracts.** Anything another component, team, or client depends on:

- HTTP routes: method, path, parameters, auth requirement, status codes, response shape
- Schemas: OpenAPI, GraphQL, protobuf, JSON schema, event and queue payloads
- Exported functions and types: signature, return value, thrown errors, defaults
- CLI flags, config keys, environment variables, and feature flags

Classify each one as additive, a behavior change, or breaking. For a breaking change to an internal interface, `git grep` the target for callers that were not updated.

**Database migrations.** List them in order. For each, note:

- Destructive operations: dropped tables or columns, type changes, renames, `NOT NULL` without a default, new unique constraints on existing data
- Locks and load: index creation without the concurrent option, rewrites of large tables, backfills inside the migration
- Reversibility: is there a down migration, and does it restore data?
- Drift: a model or ORM schema changed without a migration, or the reverse
- Ordering: duplicate sequence numbers, timestamps that sort before already-applied migrations, or several heads (Alembic, Django)

**Dependencies.** Added, removed, and upgraded packages from the manifest diff, with resolved versions from the lockfile (without a lockfile, say the resolved version is unconfirmed). Call out major version bumps, new runtime (not dev) dependencies, packages with install scripts, and lockfile-only changes. Name what each new dependency is used for (`git grep` its import). In `deep` mode, check the changelog of each major bump if web access is available.

**Refactors.** Use rename detection to tell a pure move from a move with edits. For a claimed no-op refactor, compare the old and new bodies of the moved functions. Report behavior that changed inside a refactor as a behavior change, not as part of the refactor.

**Removed functionality.** Deleted files, exports, routes, flags, config keys, and tests; removed checks such as auth, validation, and rate limits. For every removed symbol, `git grep` the target for references that remain. Say whether the removal looks deliberate (callers removed as well) or accidental.

## Impact on your work

"Your work" is the uncommitted changes (staged, unstaged, and untracked), commits on the current branch that are not on the target or upstream, and the files and symbols those touch.

| Check | How |
| --- | --- |
| Same files | Intersect your changed files with the range's changed files, following renames |
| Textual conflicts | In remote mode, run the isolated merge check for your unpushed commits. For uncommitted files, compare your hunks (`git diff-index -p HEAD -- <file>`) with the range's hunks in the same file |
| Changed interfaces you use | For each changed or removed symbol, route, type, or config key, `git grep` your changed files and your branch's diff for it |
| Moved files | Files you edit that were renamed or deleted in the range |
| Migrations | Your new migrations against the range's: numbering, ordering, and touching the same tables |
| Environment | New required env vars or config, new services (Redis, queues), toolchain version changes, and dependencies to install |
| Tests and fixtures | Fixtures, factories, or test helpers you rely on that changed |

Mark each finding: ✗ breaks or conflicts, ! needs action, ✓ checked and clear. Say how you know, for example "admin.js:4 calls `formatName(a, b)`; the new signature is `formatName(user)` (src/lib/format.js:1)".

## Risks

Report a risk only with a location and a concrete way it fails. Without both, it is a question for the author, not a finding.

**Potential bugs**

- Callers not updated after a signature, return type, or default changed
- References that remain to removed or renamed code
- Changed null, empty, or error handling; errors now swallowed or thrown where callers do not expect them
- Logic that works for the case in the commit but not for neighboring cases (pagination, time zones, concurrent requests, partial failures)
- Config read at import time, so a missing variable crashes startup or tests
- New code, config, or tables that nothing uses yet: unfinished wiring, or wiring that was lost

**Security**

- Authentication or authorization checks removed, weakened, or bypassed on any path
- New endpoints or handlers without the auth that their neighbors have
- Input validation removed; queries, shell commands, or HTML built from strings
- Secrets, tokens, or credentials in the added lines (scan them), or new logging of personal data
- CORS, CSP, cookie flags, TLS settings, or permissions loosened
- New dependencies from unfamiliar publishers, or with install scripts

**Breaking changes**

- Contract changes without versioning or a migration path for clients
- New required environment variables or services
- Destructive migrations, or migrations that need coordinated deploys
- Removed exports or behavior that other packages or external consumers use

**Missing verification**

- Behavior changes with no test changes, especially in high-signal files
- Tests deleted, skipped (`.skip`, `xit`, `@pytest.mark.skip`, `t.Skip`), or with weakened assertions
- Lint or type suppressions added; CI steps removed or made non-blocking
- Migrations with no test or down migration where the project normally has them

**Severity**

| Level | Meaning |
| --- | --- |
| High | Likely security exposure, data loss, or a production outage |
| Medium | Likely bug, a breaking change for others, or something that breaks your current work |
| Low | Worth a look: unclear intent, missing tests, fragile code |

## Confirmed and inferred

- **Confirmed** is what the code at the target shows: "GET /users/:id has no auth middleware (src/api/users.js:9)".
- **Inferred** is intent, cause, or impact you deduce: "Probably removed by accident while adding the limiter: no test or commit text mentions it."

Keep them visibly separate. Never present a commit message's claim as confirmed until the diff shows it. When the diff contradicts the message, say so; that is often the most useful finding.
