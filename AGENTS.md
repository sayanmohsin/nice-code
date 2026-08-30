# Nice Code repository instructions

This repository contains source-backed engineering patterns and guardrails for reliable software
development.

## Rules

- Do not invent standards without an approved public source.
- Keep patterns focused on judgment that existing tools cannot fully enforce.
- Every pattern needs a problem, recommendation, examples, enforcement classification, exceptions,
  and source links.
- Prefer `REVIEW` over false-positive failures in custom checks.
- Add positive, negative, and ambiguous fixtures for every detector.
- Do not commit generated checker reports.

## Checks

```bash
npm run check:docs
npm test
bun scripts/nice-code.ts --all --project . --format json
```
