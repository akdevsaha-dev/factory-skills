# Invariants for high-risk work

What must hold in each high-risk area, and how to prove it. Each invariant that applies to the change needs a check that ran. Use fakes and test modes, as `references/operating-rules.md` requires.

## Payments and money

| Invariant | Prove it with |
| --- | --- |
| Amounts are integers in the smallest unit, or exact decimals; never floats | Read the types and the arithmetic; test rounding at boundaries |
| Totals reconcile: charges, refunds, and fees sum to the stored balance | Test the sequence charge, partial refund, refund the rest; assert the balance |
| A refund or payout never exceeds what was captured | Test refunding more than captured, and two partial refunds that together exceed it |
| Each operation happens once per idempotency key | Repeat the request with the same key; assert one provider call and one record |
| Concurrent requests cannot double-spend | Send parallel requests; assert the final state |
| Webhook signatures are verified before the payload is used | Send unsigned, wrongly signed, and replayed events; assert they are rejected |
| Webhook handling is idempotent and tolerates out-of-order delivery | Deliver the same event twice, and deliver events out of order |
| State moves only along allowed transitions (pending → captured → refunded) | Test each disallowed transition |
| Only an authorized user can act on a payment | Test other users, other tenants, and unauthenticated requests |
| Provider failures leave a consistent state | Make the fake fail at each step; assert no half-written records |

## Authentication and authorization

| Invariant | Prove it with |
| --- | --- |
| Every new entry point checks authentication and authorization on the server | Unauthenticated and forbidden requests to each route, action, job, and webhook |
| Users can reach only their own or their tenant's data | Request another tenant's resource by ID; expect 404 or 403 by project convention |
| The user and tenant come from the verified session, never the request body | Send a forged `userId` or `tenantId` in the body; assert it is ignored |
| Roles cannot be self-assigned or escalated | Try to set `role` or `isAdmin` through every writable endpoint |
| Sessions and tokens expire and revoke as designed | Test expired, revoked, and reused tokens and one-time codes |

## Migrations and data

| Invariant | Prove it with |
| --- | --- |
| Existing rows survive with correct values | Run the migration on seeded realistic data; assert values |
| New constraints hold for existing data | Seed the edge cases (nulls, duplicates) before migrating |
| The migration is reversible, or is documented as one-way | Run down and up again |
| Old and new code can run during the deploy, when the project deploys that way | Run the previous code's queries against the new schema |
| Deletions are scoped and approved | Count affected rows on seeded data |

## Background jobs and integrations

| Invariant | Prove it with |
| --- | --- |
| A job can run twice without a double effect | Run it twice with the same input |
| Partial failure leaves a resumable state | Fail the fake midway; rerun; assert the final state |
| Retries are bounded and back off | Make the fake fail repeatedly; assert the attempt count |
| External calls have timeouts | Make the fake hang; assert that the job fails within the timeout |

## Matching and recommendation

| Invariant | Prove it with |
| --- | --- |
| Matches are consistent on both sides, with no one-sided or duplicate pairs | Create matches, including concurrently; assert pairs in storage |
| Eligibility rules are enforced on the server | Request matches that violate each rule |
| Results are deterministic for the same input, or randomness is seeded in tests | Run twice; compare |
| Users never see candidates they may not see (blocked, other tenant, hidden) | Seed those cases; assert they are excluded |
