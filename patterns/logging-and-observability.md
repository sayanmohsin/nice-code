# Logging and observability

## Problem

AI-generated logging often records a sentence without the identifiers needed to explain what
happened, or it logs secrets and personal data. Logs should support diagnosis without becoming a
second source of risk.

## Pattern

Use structured events with a stable event name and the smallest useful context: operation or
request identifier, safe resource identifier, outcome, and duration when relevant. Keep messages
stable enough for search and dashboards. Redact credentials, tokens, and sensitive user data.

## Avoid

- `console.log("failed")` with no operation or failure context.
- Logging complete request bodies, authorization headers, or access tokens.
- Using logs as the only source of a metric or audit record.
- Different message names for the same observable event.

## Example

```ts
logger.info("thing.read.completed", {
  thingId,
  requestId,
  durationMs,
});
```

## Enforcement

- Automated: detect obvious secret-bearing log expressions and unstructured production prints.
- Agent review: verify context, event stability, severity, and redaction.
- Human decision: define retention, access, and privacy policy.

## Exceptions

Temporary local debugging may use direct output, but it must not be committed to production paths.

## Sources

- [Microsoft Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/universal/)
- [AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/latest/framework/oe-design-principles.html)
