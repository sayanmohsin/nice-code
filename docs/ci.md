# CI

Pull requests run the fast validation gate. Pushes to `main` run the complete
Rust, launcher, package, security, documentation, and full-scan checks.

## Committed changes and comparison history

In GitHub Actions, `--ci` automatically chooses a comparison from the event:

| Event and checkout                          | Comparison                                                 |
| ------------------------------------------- | ---------------------------------------------------------- |
| PR with the default merge checkout          | Event base commit to the checked-out merge result          |
| PR with its contribution branch checked out | Common ancestor of event base/head to the checked-out head |
| Branch push                                 | Event `before` commit to `after`, including force pushes   |

The checkout must match the event. Supported changed files are read from the current checkout;
staged, unstaged, and untracked files are included too. A valid comparison with no changed supported
files succeeds with zero files. Available native checks still run.

Fetch history before scanning:

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0
- name: Nice Code
  run: nice-code --project . --ci --format json
```

Use an explicit base on another CI service or to override automatic selection:

```bash
nice-code --ci --base <available-commit> --project .
```

`--base` compares that exact commit with `HEAD`; it does not automatically choose a common
ancestor. It also works locally. Outside CI, ordinary `--changed` keeps its working-tree behavior.
JSON reports include `comparison.source`, `comparison.base`, and `comparison.target`.

Missing history, malformed event data, unsupported CI events, or a checkout that does not match the
event stop with exit status **2**. The checker explains how to fetch the needed commits or supply
`--base`; it does not fetch history itself. A new branch with no previous commit needs an explicit
base. Even a full-history checkout may need a targeted workflow fetch after a force push.

For scheduled or manual audits, choose a full scan explicitly:

```bash
nice-code --all --ci --project .
```

`--all` bypasses automatic comparison, remains advisory, and cannot be combined with `--base`.
Changed scans keep the existing blocking policy: critical failures or failed native tools return
**1**. Successful and advisory scans return **0**.

GitHub's [workflow event reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)
and [push payload reference](https://docs.github.com/en/webhooks/webhook-events-and-payloads#push)
describe the event fields used for these comparisons.

Java projects should run their native Maven or Gradle compiler, formatter, static-analysis, and
test checks alongside Nice Code. Nice Code adds conservative Java logging checks and review
guidance for Spring Boot boundaries, resilience, observability, dependencies, and testing.

```yaml
- name: Nice Code
  run: nice-code --project . --changed --ci --format sarif > nice-code.sarif

- name: Upload Nice Code report
  uses: github/codeql-action/upload-sarif@v4
  with:
    sarif_file: nice-code.sarif
```

Keep `REVIEW` findings visible without blocking automatically. Make a finding blocking only after it is high-confidence, non-duplicative, and useful to the project.

## Automated releases

Release Please owns version changes. After a release PR is merged, GitHub
Actions builds the five supported Rust binaries, creates the GitHub Release,
generates checksums, and publishes the public scoped `@sayanmohsin/nice-code` npm package.

Release Please updates the engine version in both `engine/Cargo.toml` and `engine/Cargo.lock`, alongside the npm and skill versions. `npm run check:version` checks this contract, and `npm run test:version` covers a synchronized bump and a stale lockfile. The lockfile selector accepts Release Please’s wrapped TOML names and plain names, so it updates only the engine package.

The workflow is `.github/workflows/release.yml`. To retry an existing version,
open **Actions → Release → Run workflow** and enter the full version in
`publish_version`, for example `0.1.4`. Retries replace existing GitHub assets
and skip an already-published npm version.

### npm Trusted Publishing

Configure the package's trusted publisher with:

- Publisher: GitHub Actions
- User: `sayanmohsin`
- Repository: `nice-code`
- Workflow filename: `release.yml`
- Environment: `npm-publish`

The workflow uses OIDC provenance and does not require an npm token or OTP.
For the existing GitHub `v0.1.4` release, configure this first, then dispatch
the workflow with `publish_version=0.1.4`.
