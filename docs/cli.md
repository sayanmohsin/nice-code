# CLI

The CLI is a dependency-light Node-compatible entry point. Bun can be used for local development.

```bash
nice-code --changed --project .
nice-code --all --project .
nice-code --all --verbose --project .
nice-code --all --format agent --project .
nice-code --changed --ci --format sarif --project . > nice-code.sarif
nice-code --explain AP-LOG-001
```

Useful controls include `--status FAIL,WARN`, `--include-review`, `--max-findings 20`, and `--new-only --baseline path.json`. Unknown flags fail with a usage error so a misspelled CI command cannot appear successful.
