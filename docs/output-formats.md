# Output formats

**Human** output groups findings by status and caps full scans unless `--verbose` is used.

**Agent** output is compact and stable, defaults to `FAIL` and `WARN`, and supports `--include-review` and `--max-findings`.

**JSON** is the complete machine-readable report by default. It includes schema metadata, deterministic findings, detected profiles, native-tool status, scan summary, and exit decision.

**SARIF** is intended for CI artifact and code-scanning integrations. Produce it with direct CLI invocation so package-manager banners do not corrupt the document.
