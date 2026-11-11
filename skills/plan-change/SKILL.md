---
name: plan-change
description: Plan a substantial code change before implementing it. Grounds the request in the codebase, maps affected modules, contracts, consumers, data, and trust boundaries, assesses risk, and splits the work into small verifiable slices with acceptance criteria and a verification plan. Use when asked to plan, scope, design, or assess the impact of a change, before multi-module or high-risk work such as payments, authorization, migrations, integrations, or architectural changes.
---

# Plan Change

Produce the smallest plan that lets the change be built correctly and verified: what changes, what it affects, how risky it is, and in what order to build it. A plan is a tool for the implementer, not a document to impress a reader.

Read `references/operating-rules.md` first, then `references/architecture.md`. Read `references/security.md` when the change crosses a trust boundary.

## Use when

- The change spans several modules, layers, or services
- It is high-risk by the tiers in `references/operating-rules.md`
- It changes a contract other code depends on
- The user asks for a plan or an impact assessment

For a small change in one place, skip planning; `implement-feature` plans inline.

## Inputs

- The request, or acceptance criteria if a caller already wrote them
- Optionally an impact map draft, the effort profile, and the files already read. Do not reread what the caller already summarized.

## Procedure

1. **Ground the request.** Find the code each term refers to. Turn the request into acceptance criteria: inputs, outputs, permissions, visible behavior, and failure behavior.
2. **Find the nearest analog**, and trace it end to end, as `references/architecture.md` describes. It decides layers, file placement, and test style.
3. **Map the impact.** Fill in every line of the impact map in `references/operating-rules.md` from real code. Find consumers by searching for the contract: route paths, exported names, schema fields, event names, env vars. Follow data flow from entry point to storage and back.
4. **Assess risk.** Assign the tier. For each high-risk area, name the invariants that must hold: amounts never exceed what was captured, each webhook is processed once, users only see their own tenant's data.
5. **Choose the design.** Prefer extending what exists. When there is a real choice, give the options in one line each and pick one with the reason. Do not add layers, abstractions, or configuration the task does not need.
6. **Slice the work.** Order slices so that each one leaves the system working and can be verified on its own, usually data, then core logic, then entry points, then consumers. Keep them few.
7. **Plan verification.** For each acceptance criterion and invariant, name the check that proves it: an existing test, a new test, an API call, or a browser flow. Name only checks the impact justifies. A tool the project lacks is not a reason to drop a check: `verify-work` can often run it without changing the project, such as a browser check through the Playwright CLI.

The effort profile sets depth: a few lines for `snack`, deeper architecture for `feast`, and failure modes and security boundaries for each slice for `banquet`.

## Output

```text
Goal          Partial and full refunds from the order page, settled by the provider webhook
Criteria      1. Owner or admin can refund up to the captured amount  2. Duplicate requests refund once
              3. Webhook marks the refund settled; unsigned webhooks are rejected  4. UI shows pending and errors
Analog        Capture flow: routes/payments.ts → PaymentService → PaymentRepository, webhooks/stripe.ts
Impact map    (every line from references/operating-rules.md)
Risk          High-risk: money movement, webhook trust boundary
Invariants    refunded_cents ≤ captured_cents; one refund per idempotency key; signature checked before parsing
Design        Store refunded_cents on payments (matches captured_cents); no new ledger table
Slices        1. Migration + repository  2. RefundService + provider call  3. POST /refunds + webhook  4. Refund dialog
Verification  Criterion 1: service tests + API 403/404 tests; 2: concurrent request test; 3: signed and unsigned
              webhook tests; 4: browser flow on the order page. Migration up/down on a disposable DB
Assumptions   Admins may refund any order (matches capture). Partial refunds only in the order currency
Questions     None
```

## Escalate

- Interpretations differ in ways that affect correctness, security, data, or architecture: ask, with options and a recommended default
- The design needs a new architectural pattern, a breaking contract change, or a destructive migration: state it and get approval

## Hand off

- High-risk plans go to the user for approval before any edit
- Approved plans go to `implement-feature`, slice by slice, or back to `hungry-jack` when it called this skill
- The verification plan goes to `verify-work`

Before you finish, check your list of available skills for each skill named in this section. If any is missing, end your report with the missing names, this command, and the question "Should I install them for you, or will you install them yourself?" Follow "Missing companion skills" in `references/operating-rules.md` for the rest.

```bash
npx skills add akdevsaha-dev/factory-skills --skill hungry-jack plan-change implement-feature verify-work simplify-code review-changes reflect
```

## Done when

Every acceptance criterion maps to a slice and to a check, every line of the impact map is filled from code, and the risk tier and its invariants are stated.
