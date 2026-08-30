# Baselines

Baselines let you hide findings that were already accepted before a change.

```bash
nice-code --all --format json --write-baseline .nice-code-baseline.json --project .
nice-code --changed --new-only --baseline .nice-code-baseline.json --project .
```

The baseline file is a JSON array produced by `--write-baseline`. Finding
identity uses the pattern ID, file, line, and message. `--new-only` filters the
report to findings not present in that file; it does not automatically block CI
or calculate resolved/age metrics.
