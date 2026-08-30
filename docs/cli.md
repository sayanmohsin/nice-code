# CLI

Nice Code is a lightweight Rust CLI exposed directly or through the
Node-compatible launcher. Bun is only needed for repository development
utilities, not for normal users. Human output is compact and styled only in an
interactive terminal; agent and CI output remains deterministic and
machine-friendly.

## Install

Install the public launcher with Node.js 20 or newer:

```bash
npm install --global @sayanmohsin/nice-code
nice-code --help
```

The launcher downloads the verified Rust engine for the current platform. Bun,
Cargo, and Rust are not required for normal users. Direct binaries are available
from the [latest GitHub Release](https://github.com/sayanmohsin/nice-code/releases/latest).

## Common commands

```bash
# Review changed and untracked files
nice-code --changed --project .

# Run a deliberate full scan
nice-code --all --project .

# Produce compact output for a coding agent
nice-code --changed --format agent --project .

# Run native project tools and emit SARIF for CI
nice-code --changed --ci --format sarif --project . > nice-code.sarif

# Inspect one check and write a baseline
nice-code --explain AP-LOG-001
nice-code --all --format json --write-baseline .nice-code-baseline.json
nice-code --changed --new-only --baseline .nice-code-baseline.json --format agent
```

For the complete option list and examples, run `nice-code --help`. Use
`nice-code --version` to confirm the installed launcher version.

## Output modes

- `text` is the compact human terminal view.
- `json` is the complete machine-readable report.
- `agent` is compact, stable, line-oriented output for coding agents.
- `sarif` is designed for GitHub code-scanning and CI integrations.

The default human view uses a small `◆ nice-code` mark and status summary. Use
`--color` or `--no-color` to override terminal detection. Styling is never added
to JSON or SARIF output. Useful controls include `--status FAIL,WARN`,
`--include-review`, `--max-findings 20`, `--timings`, and baseline filtering.

The CLI returns a non-zero exit code only when the report's exit decision is
blocked. Unknown or invalid flags fail with a usage error.
