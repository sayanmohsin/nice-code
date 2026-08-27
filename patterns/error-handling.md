# Error handling

## Problem

AI-generated code often catches errors too broadly, discards the original cause, logs and returns a
second error, or treats expected domain outcomes as generic internal failures.

## Pattern

Classify errors by responsibility: expected domain outcome, invalid input, dependency failure,
authorization failure, cancellation, or programming defect. Preserve causal context, return stable
external errors, and avoid exposing internal or secret-bearing details.

## Avoid

```ts
try {
  await saveThing(input);
} catch {
  return { ok: false };
}
```

## Example

```ts
try {
  await saveThing(input);
} catch (error) {
  throw new StorageError("saving thing failed", { cause: error });
}
```

## Enforcement

- Automated: flag empty catches and catches that only print an error.
- Agent review: verify classification, causality, redaction, and retry behavior.
- Human decision: define public error contracts and incident severity.

## Exceptions

An intentionally ignored error must document why ignoring it is safe.

## Sources

- [Microsoft Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/libraries/ux/)
- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
- [Google Engineering Practices](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
