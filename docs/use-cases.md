# Use cases

## Local review

Run a changed-file check before opening a pull request. Use `--verbose` when investigating the full set of findings.

## Agent loop

The repository `SKILL.md` routes an agent to relevant patterns. The agent can run `--format agent`, inspect only actionable findings, and use `--explain CHECK_ID` when it needs more context.

For Java repositories, pair the hook or CI step with the project's Maven/Gradle checks. Nice Code does not replace Java compilation, formatting, dependency analysis, Checkstyle, SpotBugs, or Spring integration tests.

## CI and audits

Use JSON or SARIF for complete artifacts. Keep uncertain `REVIEW` findings visible without turning them into automatic failures. For monthly audits, run a full scan, generate or compare a baseline, inspect recurring findings, and revise noisy patterns only when evidence supports the change.
