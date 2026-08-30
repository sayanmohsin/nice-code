# CLI

Nice Code is a lightweight Rust CLI exposed directly or through the Bun launcher.
Human output is compact and styled only in an interactive terminal. Agent and CI
output remains deterministic and machine-friendly.

```bash
bun scripts/nice-code.ts --changed --project .
bun scripts/nice-code.ts --all --project .
bun scripts/nice-code.ts --all --verbose --project .
bun scripts/nice-code.ts --all --format agent --project .
bun scripts/nice-code.ts --changed --ci --format sarif --project . > nice-code.sarif
nice-code --explain AP-LOG-001
nice-code --all --format json --write-baseline .nice-code-baseline.json
nice-code --changed --new-only --baseline .nice-code-baseline.json --format agent
```

The default human view uses a small `◆ nice-code` mark and status summary. Use
`--color` or `--no-color` to override terminal detection. Styling is never added
to JSON or SARIF output. Useful controls include `--status FAIL,WARN`,
`--include-review`, `--max-findings 20`, `--timings`, and baseline filtering.
Unknown flags fail with a usage error so a misspelled CI command cannot appear
successful.

For coding agents, use `--format agent` (or `--agent`) for stable line-oriented
output. Use JSON when the agent needs the complete report, and `--explain
CHECK_ID` when it needs guidance for one finding.
