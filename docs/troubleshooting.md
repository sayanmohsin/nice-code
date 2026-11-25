# Troubleshooting

### The changed scan reports zero files

The command scans only files changed relative to the selected base. Use `--all` to inspect the repository or verify the Git diff and project path.

### CI cannot determine changed files

Fetch the required commits in the workflow, usually with `actions/checkout` configured with
`fetch-depth: 0`. A force-pushed previous tip may need a targeted fetch. Confirm the checkout matches
the event, or pass `--base <available-commit>`. New branches, unsupported events, and other CI
providers need an explicit base. Choose `--all` for an intentional advisory audit. See [CI](/ci).

### SARIF is invalid

Run the CLI directly and redirect only its output: `nice-code --project . --changed --ci --format sarif > nice-code.sarif`.

### A native tool is missing

Install the project’s own dependencies and rerun its native checks. Nice Code records native-tool availability separately.

### A finding is uncertain

Treat `REVIEW` as a prompt for context. Use `--explain CHECK_ID`, add a narrow exception only when justified, and record noisy behavior for the next audit.
