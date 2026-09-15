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

# Inspect the curated agent-skill registry
nice-code skills list
nice-code skills show web-interface
nice-code skills check
nice-code skills outdated --project .
nice-code skills update --project .
nice-code skills update --project . --apply

# Discover or preview project guidance
nice-code advise --project .
nice-code advise --project . --format json
nice-code init --project .
nice-code init --project . --apply

# Create and validate project custom rules
nice-code rules init --project .
nice-code rules validate --project .
nice-code rules compile --project . --apply
```

Project-owned `.nice-code/checks.json` rules and Markdown rules are loaded automatically by the
normal scan. Use `nice-code rules validate` before CI; `rules compile --apply` converts explicit
Markdown checks into JSON and refuses to overwrite an existing JSON rule file. Maintainer-only
knowledge commands belong to the Nice Code repository:
`npm run knowledge:check`, `npm run knowledge:outdated`, and `npm run knowledge:list`.
Consumer projects do not need to run them; see [knowledge and project-owned rules](/knowledge).

For the complete option list and examples, run `nice-code --help`. Use
`nice-code --version` to confirm the installed launcher version.

Java and Spring Boot projects are detected automatically. Use `--ci` to include the project's Maven
or Gradle tests, with `mvnw` and `gradlew` preferred when present.

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
