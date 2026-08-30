# Agent integration

The repository-local [`SKILL.md`](https://github.com/sayanmohsin/nice-code/blob/main/SKILL.md) is an optional routing layer for coding agents. The Rust engine performs the analysis; the skill supplies context and review guidance around its results.

1. Identify the changed area.
2. Load only its relevant pattern.
3. Run a changed-file check.
4. Use a baseline with `--new-only` when accepted findings should be hidden.
5. Pass only actionable findings to the agent.
6. Use `--explain CHECK_ID` when deeper guidance is needed.

```bash
nice-code --changed --format agent --project .
nice-code --changed --format agent --new-only --baseline .nice-code-baseline.json --project .
nice-code --changed --format agent --include-review --max-findings 20 --project .
```

The skill gives review guidance; it does not claim to prove architecture or correctness from text alone.
The CLI is still the execution interface. JSON and agent output are the
supported machine-facing formats; there is no MCP server or editor plugin yet.
