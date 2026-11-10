---
name: implement-feature
description: Implement a feature or behavior change in an existing codebase like a senior engineer. Inspects similar code first, reuses what exists, follows project conventions, adds meaningful tests, runs the project's checks, and reviews its own diff. Use when asked to implement, add, build, or extend a feature, endpoint, page, component, or workflow in an existing project.
---

# Implement Feature

Implement the requested feature so it reads as if the strongest engineer on the team wrote it: correct, consistent with the codebase, simple, and verified. Another engineer should be able to open the diff, understand it quickly, and maintain it with confidence.

When goals pull against each other, prioritize in this order: correctness, consistency, simplicity, readability, maintainability, security, verification. The order settles style trade-offs. It never permits dropping a security control or a correctness requirement for simplicity.

## Ground rules

- **Understand before writing.** Never edit code you have not read, and never start a feature before you have traced how a similar one already works.
- **The codebase is the source of truth.** Its conventions beat this skill's defaults and your own preferences. Explicit project instructions (`AGENTS.md`, `CLAUDE.md`) beat both.
- **Stay in scope.** Change only what the feature needs. No drive-by refactors, renames, reformatting, or dependency upgrades. Report other problems you notice instead of fixing them.
- **Do not change existing behavior silently.** If the feature requires changing behavior that other code or users rely on, say so in the plan.
- **Evidence over claims.** Never report a check as passing unless it ran and passed in this session.

## Size the task

| Size | Looks like | Process |
| --- | --- | --- |
| Small | A few lines in an obvious place; no new data, endpoint, or trust boundary | Read the surrounding code and `references/code-quality.md`, implement, run the relevant checks, self-review the diff, report in a few lines. No written plan |
| Standard | Several files or layers, new endpoint, component, or data | Full workflow. Show the plan, then continue |
| High-risk | Migrations on existing data, auth or permissions, payments, public API or schema changes, deletion of data, cross-cutting changes | Full workflow. Wait for approval of the plan before editing |

## Step 1: Understand the request

Requests are often short and loose ("add a fallback to the fetching views"). Ground every term in the code before deciding what it means:

1. **Find what the request refers to.** Search for the views, endpoints, or modules it names. When it names a category ("the fetching views", "all forms"), list every instance; the change must cover all of them consistently.
2. **Interpret the key words from the code.** "Fallback" could mean a loading placeholder, an error state with retry, an empty state, or cached data when a request fails. The existing code usually shows what is missing and how similar cases are already handled.
3. **Write acceptance criteria:** inputs, outputs, who may do it, what the user sees, and what happens on failure.

If one interpretation is clearly right, proceed and state it as an assumption in the plan. Ask only when interpretations differ in ways that affect correctness, architecture, security, or user-facing behavior. Ask all questions together, with options based on what you found and a recommended default.

## Step 2: Inspect the codebase

Read `references/architecture.md`, then:

1. **Read project instructions.** `AGENTS.md` and `CLAUDE.md` at the root and in every directory you will touch, plus `CONTRIBUTING`, the README, and the lint, format, and type checker configs.
2. **Identify the stack.** Language, framework, package manager (from the lock file), installed major versions, and existing dependencies.
3. **Find the nearest analog.** The existing feature most similar to the request. Trace it end to end: entry point, validation, authorization, business logic, data access, response or UI, and its tests. It is your template.
4. **Search for reusable code.** Search for the feature's domain terms and for helpers, components, hooks, types, schemas, services, and errors you might otherwise write. In a large codebase, hand this broad search to a read-only search subagent if your environment has one, and keep only its conclusions.
5. **Find the checks.** Locate the project's format, lint, type check, test, and build commands (see `references/verification.md`), and run the tests that cover the area you will change, so you can later separate pre-existing failures from new ones.
6. **Note the working tree.** Check `git status`. Never modify or revert changes that were there before you started.

You are ready to plan when you can name the files you will change, the analog you are following, the code you will reuse, and the commands that verify the work.

## Step 3: Plan

For standard and high-risk tasks, show a short plan. Keep it proportional: a few lines, not a document.

```text
Goal         Users can archive a project; archived projects are hidden from the list
Analog       Project rename (routes/projects.ts → ProjectService → ProjectRepository)
Reuse        requireProjectRole(), ProjectNotFoundError, <ConfirmDialog>, useProjectMutation
Changes      modify  routes/projects.ts, services/project-service.ts, repositories/project-repository.ts,
                     components/ProjectMenu.tsx
             create  migrations/20260110_add_archived_at.sql
Data         Nullable archived_at column; list query filters it out
Risks        Existing list callers expect every project; the admin export must still include archived ones
Tests        Service: archive, already archived, non-owner denied. Route: 401, 403, 404. UI: menu action
Assumptions  Only owners can archive (matches delete). Unarchive is out of scope
```

For high-risk tasks, stop and wait for approval. Otherwise continue.

## Step 4: Implement

Read `references/code-quality.md` before writing code. Also read `references/security.md` if the feature touches a trust boundary: user input, authentication or authorization, data access, file handling, external services, money, personal data, or concurrent writes.

- **Mirror the analog.** Same layers, file placement, naming, validation, error handling, and response shape.
- **Build the whole feature, and only the feature.** Cover each concern the feature actually has: validation, business rules, authorization, persistence and migrations, error handling, loading, empty, and error states, accessibility, and tests. Skip concerns it does not have.
- **Dependencies.** Prefer the standard library, the framework, and installed packages. Add a dependency only when it removes real complexity, and say why in the report.
- **Migrations.** Use the project's migration tool. Apply migrations only to local or disposable databases; ask before applying anywhere else.
- **Generated code.** Never hand-edit generated files (ORM clients, API clients, lock files). Regenerate them with the project's command.
- **Tests.** Write them alongside the code, following `references/verification.md`.

## Step 5: Verify

Follow `references/verification.md`: format the files you changed, then run lint, type checks, the relevant tests, the full suite when practical, and the build. Investigate every failure, fix the ones you caused, and rerun.

## Step 6: Self-review

Read the complete diff, including new untracked files, as a strict reviewer who did not write it. Go through the review checklist in `references/code-quality.md`, and the one in `references/security.md` if you read it in Step 4.

Simplify wherever it makes the code clearer without losing correctness. Rerun the affected checks after every fix. The finished change should look like a native part of the codebase, not an addition from somewhere else.

## Step 7: Report

Keep it short. Do not narrate the work or describe trivial changes line by line.

```text
Implemented project archiving: owners can archive from the project menu; archived projects
are hidden from the list and still included in the admin export.

Decisions    Soft archive with archived_at instead of a status enum, matching deleted_at on users
Checks       ✓ lint  ✓ typecheck  ✓ 214 tests (12 new)  ✓ build
Not verified Migration applied only to the local database
Limitations  No unarchive action (out of scope)
Noticed      ProjectService.list has no pagination; not changed
```

Do not call the work production-ready unless the evidence supports it.
