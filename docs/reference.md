# Quick reference

| Need            | Command                                                               |
| --------------- | --------------------------------------------------------------------- |
| Changed files   | `nice-code --changed --project .`                                     |
| Full scan       | `nice-code --all --project .`                                         |
| Agent output    | `nice-code --changed --agent --project .`                             |
| Include review  | `nice-code --all --agent --include-review --project .`                |
| Limit output    | `nice-code --all --max-findings 20 --project .`                       |
| New findings    | `nice-code --changed --new-only --baseline baseline.json --project .` |
| Explain a check | `nice-code --explain AP-LOG-001`                                      |
| CI SARIF        | `bun scripts/nice-code.ts --changed --ci --format sarif --project .`  |

The machine-readable report remains the source for automation; terminal output is a view of that report.
