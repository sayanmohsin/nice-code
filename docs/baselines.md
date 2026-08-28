# Baselines

Baselines separate existing work from findings introduced by a change.

```bash
nice-code --all --format json --write-baseline .nice-code-baseline.json --project .
nice-code --changed --new-only --baseline .nice-code-baseline.json --project .
```

Finding identity is stable across runs using the pattern ID, file, line, and message. Reports can describe new, resolved, repeated, and unchanged findings without committing detailed scan output.
