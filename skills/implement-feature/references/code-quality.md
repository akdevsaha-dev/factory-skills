# Code quality

Standards for writing the code, and the checklist for reviewing it. Optimize for clarity, correctness, and maintainability, not for fewer lines. Where the project's own style differs from a rule below, follow the project.

## Naming

- Use the codebase's domain vocabulary. If the code says `workspace`, do not introduce `team` for the same thing.
- Names say what something is or does, not its type: `activeSubscriptions`, not `subscriptionArray` or `data`.
- Booleans read as questions: `isArchived`, `hasAccess`, `canEdit`.
- Functions start with a verb that matches their effect: `get` and `find` do not write; `create`, `update`, `send`, and `sync` do.
- Put units in names when the type does not carry them: `timeoutMs`, `priceCents`, `maxSizeBytes`.
- Avoid vague names for new modules and functions: `utils`, `helpers`, `manager`, `handler2`, `processData`, `doStuff`. Name the actual responsibility.
- Follow the project's casing and abbreviations exactly.

## Functions and control flow

- One clear responsibility per function. If describing it needs "and", consider splitting it.
- Use guard clauses and early returns for invalid input and edge cases, so the main path reads straight down.
- Keep nesting shallow. Past two or three levels, extract a well-named function or restructure the conditions.
- Extract a block into a named function when the name would explain it better than a comment would. Do not extract tiny one-use functions that only move code around.
- Avoid boolean parameters that switch behavior (`save(user, true)`). Use two functions or a named option.
- Keep pure logic separate from I/O when the project does, so rules can be tested without mocks.
- Large components and functions are a smell, not a rule violation. Split by responsibility, not by line count.

## Types

- No `any`, unchecked casts (`as Foo`, `# type: ignore`, `interface{}` without a type switch), non-null assertions, or suppressed compiler or lint errors. If one is truly unavoidable, keep it as narrow as possible and add a comment saying why.
- Parse untrusted data at the boundary into a typed value, then trust the types inside.
- Reuse existing types and schemas. Derive types from schemas when the project does (for example `z.infer`, Pydantic models, generated API types) instead of declaring them twice.
- Model distinct states explicitly (a discriminated union or enum) instead of a bag of optional fields that allows impossible combinations.
- Do not annotate what the compiler already infers clearly, unless the project does.

## Values and constants

- Name values whose meaning is not obvious: `MAX_INVITES_PER_DAY = 20`, not a bare `20`. Do not name values that are already obvious (`0`, `1`, `''`, `items.length - 1`).
- Put a constant in the narrowest scope that needs it. Move it to shared config only when several modules use it or it varies by environment.

## Errors and edge cases

- Use the project's error types, error middleware, and response format.
- Catch an error only where you can handle it, add context, or translate it at a boundary. Never catch only to log and rethrow, and never swallow errors silently.
- Do not wrap code that cannot fail in `try`/`catch`.
- Handle real edge cases: empty collections, missing records, duplicates, concurrent updates, external failures, and limits.
- Do not add defensive checks for states the types or earlier validation already rule out. Redundant checks hide the real invariants.
- Error messages shown to users are helpful and reveal nothing internal. Log the detail on the server instead.

## Abstraction

- Prefer plain functions and data. Add a class, interface, factory, wrapper, or generic only when it has a present use, or when the project's architecture requires it (for example DI with interfaces).
- No interface with a single implementation, unless that is the project's pattern.
- No configuration options, extension points, or parameters for hypothetical future needs.
- No compatibility layers, feature flags, or fallback behavior without a real requirement. A user asking for one is a real requirement.
- No wrapper around a library that only renames its functions.

## Frontend

- Reuse the design system's components and tokens. Do not hand-build a button, modal, or input the project already has.
- Follow the project's data-fetching and state approach. Do not add a new state library for one feature.
- Cover the states the UI can actually reach: loading, empty, error, success, and disabled or pending during submission. Prevent double submission.
- Accessibility: semantic elements (`button`, not a clickable `div`), labels for inputs, alt text, keyboard operability, visible focus, focus management in dialogs, and announced errors.
- Do not keep derived values in state. Compute them during render.
- Keep components focused. Extract a child component when a section has its own state or a clear name, not to hit a size target.

## Comments

Code explains what it does through naming, structure, and control flow. Comments explain why, and only when the code cannot.

Write a comment only for:

- A business rule that is not obvious from the code ("Refunds after 30 days go to manual review, per finance policy")
- A security-sensitive decision ("Same response for unknown emails, to prevent account enumeration")
- A workaround for an external system's quirk, ideally with a link
- An important constraint or invariant ("Must run before the cache warm-up; it reads the same keys")
- A complex algorithm, or why an unusual approach was chosen over the obvious one

Never write:

- Comments that restate the code: `// Increment counter`, `// Fetch the user`, `// Return response`
- Comments that repeat the function or variable name
- Step-by-step narration: `// Step 1: validate input`
- Section banners and decorative separators
- Docstrings on every function. Add them only where the project requires them or the function is a public API whose contract is not obvious from its signature
- `TODO`s for work you could do now, or placeholders standing in for missing implementation
- Comments about the change itself ("Added for the archive feature", "New implementation"). That belongs in the commit message

Preserve useful existing comments, and update any your change makes inaccurate.

## Signs of generated code

Besides breaking the rules above, generated code tends to include these. Remove them before finishing:

- `catch` blocks that catch everything and return `null` or an empty value
- Logging at every step, or logging whole objects that may contain personal data
- Unused imports, parameters, variables, or exports
- New helper files that duplicate existing utilities
- Default values that hide bugs (`?? []`, `|| 'unknown'`, `.get(key, {})` where the value is required)
- Re-implemented framework features (custom validation the framework already does, manual JSON parsing middleware)
- Inconsistent style within one file (mixed quotes, import styles, async patterns)

## Review checklist

Use this in the self-review on the complete diff:

- [ ] Everything requested works, including failure paths
- [ ] Behavior outside the requested scope is unchanged, or the change is called out
- [ ] Follows the surrounding code's structure, naming, and patterns; nothing reads as foreign to the codebase
- [ ] No duplicated logic that already exists in the codebase
- [ ] No unnecessary files, layers, abstractions, options, or dependencies
- [ ] Names are precise and use the domain vocabulary
- [ ] Functions are focused; control flow is flat and readable
- [ ] Types are sound: no `any`, unsafe casts, or suppressions without justification
- [ ] Errors are handled where meaningful and never swallowed
- [ ] Real edge cases are handled; impossible ones are not guarded against
- [ ] Comments explain only why; none narrate the code
- [ ] No signs of generated code from the list above
- [ ] Tests cover the new behavior and its main failure paths
- [ ] No debug output, commented-out code, or leftover experiments
- [ ] No unrelated changes: formatting, renames, lock file churn, or edits to files you did not need to touch
- [ ] Imports resolve; generated files were regenerated, not hand-edited
