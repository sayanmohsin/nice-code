---
name: nice-code
description: Source-backed engineering guardrails for reviewing AI-generated code, especially logging, errors, async work, state, persistence, security, testing, performance, APIs, and reliability.
version: 0.1.7 # x-release-please-version
license: MIT
---

# Nice Code

Use this skill when writing or reviewing code where correctness depends on engineering judgment,
not only formatting or compiler feedback.

## Routing

Read only the relevant pattern before making a recommendation:

- Logging or telemetry: `patterns/logging-and-observability.md`
- Branches and business conditions: `patterns/conditions-and-control-flow.md`
- Async work or concurrency: `patterns/async-and-concurrency.md`
- Errors and failure boundaries: `patterns/error-handling.md`
- APIs, schemas, or trust boundaries: `patterns/api-boundaries.md`
- State ownership or data flow: `patterns/state-and-data-flow.md`
- Storage, migrations, or durability: `patterns/persistence-and-data-integrity.md`
- Tests or verification: `patterns/testing-and-verification.md`
- Credentials, authorization, or privacy: `patterns/security-and-secrets.md`
- Performance claims or optimization: `patterns/performance-measurement.md`
- Availability, deployment, or recovery: `patterns/reliability-and-operations.md`
- React or UI behavior: `patterns/react-and-ui.md`
- AI-generated change review: `patterns/code-review-and-ai.md`

## Review discipline

1. Identify the behavior and failure mode being protected.
2. Check whether an existing compiler, formatter, linter, or framework tool already covers it.
3. Apply the source-backed pattern only where it adds judgment.
4. State evidence, uncertainty, exceptions, and validation performed.
5. Do not claim an architecture or performance property from text inspection alone.

The full source registry is in `sources/index.md`. The executable checker is
`scripts/nice-code.mjs`; use changed-file mode by default and `--all` for an explicit deeper scan. The launcher uses Node.js and does not require Bun.
