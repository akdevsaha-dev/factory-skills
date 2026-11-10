# Architecture and conventions

How to read an unfamiliar codebase quickly, decide where new code belongs, and choose between reusing, extending, and creating.

## Which source wins

When sources disagree, follow the first one that applies:

1. The user's explicit request
2. Project instructions: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING`, and the nearest nested instructions file to the code you are changing
3. The established pattern closest to the change: same module, then same layer, then the rest of the repository
4. The framework's official conventions
5. This skill's defaults
6. Your own preferences

Tooling enforces some conventions (linters, formatters, type checker settings). Treat those configs as binding.

## What to learn before writing code

Learn only the concerns the feature touches. Answer each question from real code, not assumption.

| Concern | Look at | Answer |
| --- | --- | --- |
| Layout | Top-level folders, the analog's folder | Is code grouped by feature (`features/billing/`) or by layer (`routes/`, `services/`)? |
| Entry points | Router, route files, controllers, pages, CLI commands | How is a new route, page, or command registered? |
| Validation | Schemas near the entry points | Which library, where it runs, and how errors are returned |
| Business logic | Services, use cases, domain modules, or route handlers | Where rules live, and how thin the handlers are |
| Data access | Repositories, ORM calls, query builders, migrations | Who may talk to the database, how transactions are opened, how migrations are created |
| Errors | Error classes, error middleware, result types | How failures are raised and translated into responses |
| Auth | Middleware, guards, dependencies, policy helpers | How the current user is obtained and how permissions are checked |
| State (frontend) | Stores, query/cache libraries, context, server components | Where server data, client state, and form state live |
| UI | Component library, design system, styling approach | Which components, tokens, and patterns to reuse |
| Config | Config module, env validation | How settings are read and validated |
| Logging | Logger setup | Which logger, and the structure of log entries |
| Tests | Test folders, fixtures, factories, mocks | Test style, naming, setup, and how external services are faked |

## The nearest analog

The best predictor of how new code should look is the most similar code that already exists.

- Choose by similarity of shape (a CRUD endpoint, a form, a background job, a webhook), then of domain.
- Prefer code that is actively maintained. `git log` on the candidates shows which ones are recent and frequently touched; avoid code that looks deprecated or is marked legacy.
- Trace it all the way through, including its tests. Note every file it touches; your feature will usually need the same set.
- If there is no analog, follow the framework's official conventions in the simplest form that fits the surrounding code.

## Inconsistent conventions

Codebases often contain two patterns for the same thing (two validation libraries, old and new data access).

- Prefer the pattern the project instructions name, then the one used by recent and actively changed code, then the one nearest the change.
- Use exactly one pattern within the feature. Never mix both.
- Do not migrate the old pattern as part of the feature.
- Mention the choice in the report when it is significant.

## Where new code goes

- Put a new file next to its closest siblings, with the same naming pattern: case style, suffixes such as `.service.ts` or `_test.go`, and singular or plural.
- Add to an existing file when the new code belongs to that file's responsibility and the file stays a reasonable size. Create a new file when it is a distinct unit that siblings would also be separate files for.
- Do not create new top-level folders, layers, or architectural patterns (a repository layer, an event bus, a DI container) unless the feature cannot be built well without one. If one is truly needed, explain why in the plan.
- Do not add barrel or index files unless the surrounding folders use them.
- Respect layer boundaries. If routes call services and services call repositories, a route must not query the database directly, and a UI component must not call an API the project wraps elsewhere.
- In a monorepo, change the package that owns the behavior. Put shared code in an existing shared package, not a new one.

## Reuse, extend, or create

Search before writing anything that sounds generic: formatting, dates, money, pagination, validation, HTTP clients, retries, permissions, error types, UI primitives.

1. **Reuse** existing code that does what you need, even if it is not exactly how you would write it.
2. **Extend** an existing abstraction when the addition fits its current responsibility and every existing caller still makes sense afterwards.
3. **Create** new code when nothing fits, or when extending would hurt the existing abstraction.

Do not extend when the change would:

- Add a boolean or mode parameter that makes the function do two different things
- Couple a general-purpose module to one feature's domain
- Change the behavior or contract existing callers rely on
- Turn a simple function into a configurable framework

Do not create a shared abstraction from a single use. Extract shared code when real duplication exists in the code you are writing and the duplicated parts change for the same reasons. Two similar-looking blocks that will evolve differently should stay separate.

## Dependencies

Before adding a package, check the standard library, the framework, and the installed dependencies. Add one only when it removes real complexity or risk (cryptography, parsing standard formats, date and time zone math), it is actively maintained, and its size suits the problem. Install it with the project's package manager, so the lock file is updated, and name it in the report.

## Data changes

- Create schema changes with the project's migration tool and follow its naming. Never edit a migration that has already been applied or shared.
- Make migrations safe for existing data: defaults or backfills for new non-null columns, and no destructive changes without explicit approval.
- Regenerate ORM clients and types after schema changes.
