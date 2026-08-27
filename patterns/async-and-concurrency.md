# Async and concurrency

## Problem

Generated code commonly turns independent work into a sequential await chain, increasing latency,
or introduces concurrency without ownership, cancellation, backpressure, or failure semantics.

## Pattern

Identify dependencies first. Start independent work together, await it together, and make limits,
cancellation, retries, and partial failure behavior explicit. Prefer measured concurrency over
unbounded spawning.

## Avoid

```ts
const user = await loadUser();
const settings = await loadSettings();
```

when the operations are independent and can safely overlap.

## Example

```ts
const [user, settings] = await Promise.all([loadUser(), loadSettings()]);
```

## Enforcement

- Automated: identify likely sequential awaits and report them as `REVIEW`.
- Agent review: confirm dependency order, cancellation, retries, and resource limits.
- Human decision: choose consistency, latency, and cost tradeoffs.

## Exceptions

Sequential execution is correct when the second operation depends on the first, ordering is part of
the contract, or concurrency would exceed a resource limit.

## Sources

- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
- [Microsoft Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/performance/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html)
