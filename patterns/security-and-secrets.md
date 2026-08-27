# Security and secrets

## Problem

Generated code can move secrets into client bundles, logs, source files, tests, or error responses,
or can trust input at a boundary without validating authorization and invariants.

## Pattern

Keep secrets server-side, validate at boundaries, authorize before access, minimize collected data,
and make redaction the default. Treat user-controlled identifiers, URLs, paths, and serialized
objects as untrusted input.

## Avoid

- Logging tokens, passwords, authorization headers, or full private payloads.
- Embedding server credentials in frontend configuration.
- Treating authentication as authorization.
- Relying on client validation for a server-side invariant.

## Example

```ts
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API key is not configured");
```

## Enforcement

- Automated: scan changed files for common secret names and secret-bearing log expressions.
- Agent review: inspect trust boundaries, authorization, data minimization, and error disclosure.
- Human decision: define threat model, retention, and incident response.

## Exceptions

Fixtures may contain clearly synthetic values, but must use unmistakable placeholders.

## Sources

- [AWS Well-Architected security](https://docs.aws.amazon.com/wellarchitected/latest/framework/security.html)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
