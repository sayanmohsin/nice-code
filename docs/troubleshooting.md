# Troubleshooting

### The changed scan reports zero files

The command scans only files changed relative to the selected base. Use `--all` to inspect the repository or verify the Git diff and project path.

### SARIF is invalid

Run the CLI directly and redirect only its output: `node scripts/nice-code.mjs --project . --changed --ci --format sarif > nice-code.sarif`.

### A native tool is missing

Install the project’s own dependencies and rerun its native checks. Nice Code records native-tool availability separately.

### A finding is uncertain

Treat `REVIEW` as a prompt for context. Use `--explain CHECK_ID`, add a narrow exception only when justified, and record noisy behavior for the next audit.
