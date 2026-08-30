# Output formats

**Human** output uses the compact `◆ nice-code` layout in a terminal, with
adaptive colors and symbols. Redirected output automatically becomes plain text.
Use `--verbose` for full review findings.

**Agent** output is compact, stable, and line-oriented. It reports status, mode,
files, findings, blocked state, and actionable findings. It defaults to `FAIL`
and `WARN`, and supports `--include-review` and `--max-findings`.

**JSON** is the complete machine-readable report by default. It includes schema metadata, deterministic findings, detected profiles, native-tool status, scan summary, and exit decision.

**SARIF** is intended for CI artifact and code-scanning integrations. Produce it with direct CLI invocation so package-manager banners do not corrupt the document.
