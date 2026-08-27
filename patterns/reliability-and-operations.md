# Reliability and operations

## Problem

AI-generated services can omit readiness behavior, timeouts, observability, rollback paths, or
failure testing while appearing correct in the happy path.

## Pattern

Define health and readiness separately, bound external work with timeouts, make retries safe,
expose actionable telemetry, deploy small reversible changes, and test expected failure modes.

## Avoid

- Retrying every error indefinitely.
- Calling a process healthy because it started rather than because it can serve traffic.
- Adding telemetry without an operational question it answers.
- Making a large irreversible deployment without a rollback path.

## Example

```text
Readiness: dependencies required for serving are available.
Liveness: the process can make progress.
Timeout: each external call has a bounded deadline.
Rollback: the previous artifact and migration path are known before release.
```

## Enforcement

- Automated: run health, timeout, retry, migration, and deployment checks where available.
- Agent review: inspect failure modes, observability, recovery, and blast radius.
- Human decision: set availability targets, recovery objectives, and release gates.

## Exceptions

Development-only services may relax production availability requirements, but must not silently use
development fallbacks in production.

## Sources

- [AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html) — operational excellence and reliability pillars
- [Google Engineering Practices](https://google.github.io/eng-practices/review/reviewer/standard.html) — continuous code-health improvement
