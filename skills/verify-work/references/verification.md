# Verification

How to find the project's checks, write tests worth keeping, handle failures honestly, and report what was verified.

## Find the checks

The project defines what "passing" means. Look in this order:

1. Project instructions (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING`) for documented commands
2. CI workflows (`.github/workflows/`, `.gitlab-ci.yml`, and similar): the checks that must pass before merge
3. Task runners: `package.json` scripts, `Makefile`, `justfile`, `Taskfile.yml`, `noxfile.py`, `tox.ini`
4. Tool configs: `pyproject.toml`, `tsconfig.json`, ESLint, Prettier, Biome, Ruff, golangci-lint, and similar

Prefer the project's scripts over invoking tools directly; they carry the right flags and paths. Use the package manager the lock file indicates. In a monorepo, run checks in the affected packages.

## Baseline

Before changing code, run the tests that cover the area you will change (and the type checker, if it is fast). Record failures that already exist, so you can tell them apart from failures you introduce.

## Order

Run these after implementing, fixing problems as you go:

1. **Format** only the files you changed. Do not run a formatter over the whole repository; it creates unrelated diffs.
2. **Lint**, with the project's configuration.
3. **Type check**, where the language supports it.
4. **Targeted tests:** the new tests and the tests for the code you changed.
5. **Full test suite**, when it runs in reasonable time. Otherwise, the suites for every affected package or module, and say so in the report.
6. **Build**, when the project has a build step.
7. **Run it**, when practical: start the app and exercise the feature (an HTTP request, a CLI invocation, a page load). Type checks and unit tests do not prove that wiring, configuration, or migrations work.

## Writing tests

Follow the project's test style, folder layout, naming, fixtures, and factories. Mirror the tests of the analog feature.

Test:

- Each acceptance criterion, through the most public interface practical (the HTTP endpoint, the service function, the rendered component)
- The main failure paths: invalid input, missing records, unauthorized and forbidden access, conflicts, and external failures
- Edge cases that are realistic for this feature: empty, boundary values, duplicates, concurrency where it matters
- A regression test for any bug the change fixes

Do not write:

- Tests that only restate the implementation, or assert that a mock was called with exactly the arguments the code passes it
- Tests for trivial code (getters, constants, framework behavior)
- Snapshot tests of large outputs that no one will review
- Tests that mock the unit under test, or so much around it that nothing real runs

Keep tests deterministic: control time, randomness, and network. Use the project's existing approach for faking external services.

A test is only useful if it would fail without the change. For the key tests, confirm this, either by reasoning about it carefully or by briefly reverting the relevant line and running the test.

## When a check fails

1. Read the full error. Reproduce it with the narrowest command.
2. Decide whether the change caused it: compare with the baseline, and check whether the failing code touches what you changed.
3. Fix failures you caused at the root, in the implementation, not in the test.
4. Rerun the failing check, then the broader checks.

Never:

- Weaken, skip, delete, or loosen assertions in existing tests to make them pass
- Edit unrelated tests or snapshots to match new output
- Disable lint rules, add type suppressions, or use `--no-verify` to get past a failure
- Retry a flaky test until it passes and report it as passing

If an existing test fails because it asserts behavior the user asked you to change, update that test and say so in the report. If a failure existed in the baseline or comes from the environment (no network, missing service, missing credentials), leave it alone and report it.

## Reporting

- List each check with its result: passed, failed, or not run.
- Report a check as passed only if it ran and passed in this session, after your last change to the code it covers.
- For checks that did not run, give the reason and the command to run them.
- Name anything verified only partially, such as a migration applied only locally or an integration tested only against a fake.
