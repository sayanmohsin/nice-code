# Persistence and data integrity

## Problem

Generated persistence code can lose updates, partially apply related writes, ignore migration
compatibility, or treat a successful write as proof that the desired invariant holds.

## Pattern

State the invariant, choose transaction and ordering boundaries deliberately, make retries and
idempotency explicit, preserve compatibility during migration, and verify read-after-write behavior
at the same durability boundary users rely on.

## Avoid

- Updating related records without a transaction or recovery plan.
- Retrying a non-idempotent write blindly.
- Treating cache state as durable state.
- Changing serialized data without a migration and rollback strategy.

## Example

```text
Invariant: a completed match has exactly one completion event and one summary.
Write boundary: append event and update summary atomically.
Retry behavior: duplicate event IDs are safely ignored.
Verification: reopen the store and replay the event log before reporting success.
```

## Enforcement

- Automated: run migration, transaction, durability, and adapter-parity tests.
- Agent review: inspect invariants, failure windows, retries, recovery, and compatibility.
- Human decision: approve data-loss risk, migration sequencing, and retention policy.

## Exceptions

Eventual consistency is acceptable only when the user-visible contract documents the delay and
recovery behavior.

## Sources

- [AWS Well-Architected reliability](https://docs.aws.amazon.com/wellarchitected/latest/framework/reliability.html) — lifecycle and recovery testing
- [Microsoft Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/correctness/) — correctness and soundness
