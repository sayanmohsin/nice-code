# Nice Code

Source-backed engineering patterns and guardrails for reliable software development.

Nice Code helps humans and AI-assisted developers catch important engineering mistakes that
formatters, compilers, and linters cannot fully judge:

- Logging without useful context or with sensitive data
- Sequential async work and unsafe concurrency
- Weak error boundaries and swallowed failures
- Incorrect state ownership and data flow
- Unsafe persistence and migration behavior
- Tests that pass without protecting real behavior
- Unmeasured performance claims
- Security and privacy mistakes
- API, reliability, and operational design gaps

Nice Code is deliberately not a replacement for language tooling. It adds a conservative,
evidence-oriented review on top of Clippy, Biome, TypeScript, Dart Analyzer, `gofmt`, framework
checks, and project-specific tests.

## How it works

```text
Public engineering guidance
        ↓
Nice Code patterns and source registry
        ↓
Optional custom checks + native project tooling
        ↓
Local review, commit check, or CI report
```

Every pattern is classified as:

- **Automated** — a tool can detect it reliably.
- **Agent review** — context and engineering judgment are required.
- **Human decision** — product, risk, or operational tradeoffs are involved.

Uncertain results are reported as `REVIEW`; the checker does not claim that a text search proves an
architectural or performance property.

## Quick start

Nice Code is developed with Bun, but the published CLI requires only Node.js 20 or newer and has
no runtime dependencies. The implementation uses portable Node APIs, so Bun-only APIs are not
required for npm users.

From this repository:

```bash
npm test
npm run check:docs

# Bun-first local validation
bun run test:bun
bun run check:bun
```

Check another project for only changed and untracked source files:

```bash
node scripts/check.mjs \
  --project /path/to/project \
  --changed
```

Run a deliberate full scan:

```bash
node scripts/check.mjs \
  --project /path/to/project \
  --all
```

The checker detects Rust, Go, Dart, TypeScript, React, Astro, and Svelte projects from their
standard manifest files. It scans supported source files and does not modify the target project.

## Checker modes

| Command | Use |
| --- | --- |
| `--changed` | Fast default for local development and commits |
| `--all` | Explicit deeper scan of supported source files |
| `--ci` | Changed-file scan plus available native project tools |
| `--json` | Machine-readable report for CI artifacts and metrics |
| `--format agent` | Compact, line-oriented findings for coding agents |
| `--agent` | Alias for `--format agent` |
| `--verbose` | Show all human-readable findings in a full scan |
| `--include-review` | Include `REVIEW` findings in agent output |
| `--status STATUS,...` | Filter output by `FAIL`, `WARN`, `REVIEW`, or `PASS` |
| `--max-findings N` | Limit displayed or explicitly filtered findings |
| `--new-only` | Show only findings not present in the supplied baseline |
| `--color` / `--no-color` | Force or disable colors in human-readable output |
| `--explain CHECK_ID` | Show the purpose, severity, and source for a check |

Examples:

```bash
# Fast local check
node scripts/check.mjs --project . --changed

# Explain one finding
node scripts/check.mjs --explain AP-LOG-001

# CI-oriented check
node scripts/check.mjs --project /path/to/project --ci

# Compact output for an agent loop
node scripts/check.mjs --project /path/to/project --changed --format agent

# Equivalent agent shorthand
node scripts/check.mjs --project /path/to/project --changed --agent

# Keep agent context small and focused
node scripts/check.mjs --project /path/to/project --all --agent --status FAIL,WARN --max-findings 20

# Save an ephemeral report and summarize it
node scripts/check.mjs --project /path/to/project --all --json > /tmp/nice-code-report.json
node scripts/metrics.mjs /tmp/nice-code-report.json
```

## Bun and Node support

Bun is the preferred local runtime for fast script and test execution:

```bash
bun scripts/test-checker.mjs
bun scripts/check.mjs --project . --all
```

Node remains the compatibility baseline for the published executable:

```bash
node scripts/test-checker.mjs
node scripts/check.mjs --project . --all
```

The CI matrix runs both runtimes. Nice Code does not use Bun-specific APIs, because users may
install it with npm and run it through `npx` without Bun installed.

Measure before making performance claims:

```bash
npm run benchmark
```

The benchmark compares the fixture scan under available runtimes. Filesystem work, Git, and
external native tools may dominate the total time, so startup results are not a guarantee of
end-to-end improvement.

`--changed` reads the target Git diff against `HEAD` and includes untracked files. A clean project
therefore produces a report with zero scanned files. `--all` is opt-in so routine work does not
scan an entire repository unnecessarily.

Initialize an explicit project configuration without overwriting an existing one:

```bash
node scripts/init.mjs --project /path/to/project
```

The generated `.nice-code.json` supports `profiles`, path `ignore` patterns, per-check `severity`
overrides, and precise `exceptions` with a required reason. See
[`examples/project-config.json`](examples/project-config.json). Exceptions are intentionally
specific; they do not disable a whole category.

For GitHub code scanning or other SARIF consumers:

```bash
node scripts/check.mjs --project . --ci --format sarif > nice-code.sarif
```

Use `--baseline previous-report.json` when adopting Nice Code gradually. The report keeps all
findings and records the number of new findings; CI blocks only new critical custom findings.
See [`examples/github-actions.yml`](examples/github-actions.yml) for a starting point.

Create a baseline intentionally:

```bash
node scripts/check.mjs --project . --all --format json --write-baseline .nice-code-baseline.json
```

JSON reports expose `schemaVersion`, `checkerVersion`, `customFindings`, `nativeTools`, `activeProfiles`,
detected workspace packages, stable `exit` information, and a `fileClass` for each finding
(`production`, `test`, `example`, `migration`, or `generated`). Findings are sorted by file, line, and
check ID so consumers can compare reports consistently. `--format agent` omits JSON decoration and
prints one actionable finding per line, which is suitable for an agent to parse without loading the
full pattern library. Human-readable output uses colors and symbols when attached to a terminal;
colors are disabled automatically for CI, redirected output, and `NO_COLOR`. Use `--color` or
`--no-color` to override that behavior.
Native tools can be `PASS`, `FAIL`, or `SKIPPED`; a missing optional tool is not a Nice Code
finding.

## Reading results

```text
FAIL   AP-SEC-001  src/auth.ts:12  Possible hardcoded credential
REVIEW AP-ASYNC-001 src/data.ts:22  Multiple awaits may be independent
REVIEW AP-PERF-001 src/list.ts:8   Review collection allocation cost
```

- `FAIL` means a high-confidence critical finding or failed native CI tool.
- `WARN` means a potentially important finding that should be considered.
- `REVIEW` means the checker found a pattern requiring context or human judgment.
- `PASS` is reserved for checks that explicitly prove a condition.
- `N/A` is used in documentation and review discussions when a pattern does not apply.

CI blocks only critical custom findings and failed native tools. Warnings and review findings are
reported without blocking progress. Do not turn the output into one quality score.

## Native tooling

In `--ci` mode, Nice Code uses tools already available in the target project:

- Rust: `cargo fmt --all --check`
- TypeScript: local `tsc --noEmit`
- Biome: local `biome check .`
- Go: `go vet ./...`
- Dart: `dart analyze`

Nice Code does not install dependencies or download tools during a check. If a tool or manifest is
missing, it is skipped and the result remains explicit in JSON output.

## Commit and CI integration

Add a project script that points to the checked-out Nice Code repository:

```json
{
  "scripts": {
    "nice-code:check": "node ../nice-code/scripts/check.mjs --project . --changed"
  }
}
```

For CI, use the checker as a repository step after installing the project’s own dependencies:

```yaml
- name: Run Nice Code
  run: node /path/to/nice-code/scripts/check.mjs --project . --ci
```

A commit hook may run `--changed` for fast feedback. Full scans should be explicit or scheduled so
they do not add unnecessary work to every edit.

## Agent skill integration

The root [`SKILL.md`](SKILL.md) is an Agent Skills-compatible router. It tells an agent which
pattern to read for logging, persistence, performance, React, security, testing, or other work.
The detailed patterns are not loaded for unrelated tasks.

To use it globally, install or copy this repository as a skill named `nice-code` in the agent’s
skills directory. For Codex, the local destination is typically:

```text
~/.codex/skills/nice-code/
```

The skill is supplemental. Project-local `AGENTS.md` files still define repository architecture,
commands, boundaries, and exceptions.

The CLI and skill are separate on purpose: the CLI produces repeatable evidence, while the skill
helps an agent reason about context before and during a change. A project can use either one or
both.

## Patterns

Read the [pattern index](patterns/index.md) for the complete catalog. Current patterns include:

- Logging and observability
- Conditions and control flow
- Async and concurrency
- Error handling
- API boundaries
- State and data flow
- Persistence and data integrity
- Testing and verification
- Security and secrets
- Performance measurement
- Reliability and operations
- React and UI behavior
- Code review and AI-generated changes

## Adding or changing a pattern

Every pattern must include:

1. The engineering problem.
2. The recommended pattern.
3. An anti-pattern or failure example.
4. A practical example.
5. Automated, agent-review, and human-decision enforcement notes.
6. Exceptions and tradeoffs.
7. An official public source.

Do not duplicate rules already handled by a compiler, formatter, or linter unless the pattern
protects a higher-level behavior. Add positive, negative, and ambiguous fixtures for new checks.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the lifecycle from proposed to adopted, revised,
deprecated, or rejected.

Review the source registry and run the monthly process in
[`docs/monthly-audit.md`](docs/monthly-audit.md) before adopting changes. This keeps the guidance
easy to improve without silently changing it or copying an entire external guide.

## Sources

The source registry is in [`sources/index.md`](sources/index.md). It currently references public
guidance from Microsoft, Google, React, Vercel, Airbnb, Dart, Go, AWS, and MDN.

Nice Code summarizes and attributes external guidance; it does not reproduce complete third-party
documents. Sources are reviewed and dated so upstream changes can be revisited deliberately.

## Monthly audit

Use [`docs/monthly-audit.md`](docs/monthly-audit.md) once a month to review sources, run deliberate
full scans, compare findings with native tools, measure false positives, and decide whether a
pattern should be adopted, revised, deprecated, or rejected. Detailed reports stay in local or CI
artifacts; only a small trend summary should be committed when needed.

## npm package

The package is prepared for public npm distribution. Before a release, inspect the exact tarball:

```bash
npm run pack:check
```

After publication, users can run the CLI without cloning the repository:

```bash
npx nice-code --project . --changed
bunx nice-code --project . --changed
```

Release publication should happen from trusted CI with npm provenance enabled where supported.

## License

Nice Code is released under the MIT License.
