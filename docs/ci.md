# CI

Pull requests run the fast validation gate. Pushes to `main` run the complete
Rust, launcher, package, security, documentation, and full-scan checks.

```yaml
- name: Nice Code
  run: nice-code --project . --changed --ci --format sarif > nice-code.sarif

- name: Upload Nice Code report
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: nice-code.sarif
```

Keep `REVIEW` findings visible without blocking automatically. Make a finding blocking only after it is high-confidence, non-duplicative, and useful to the project.

## Automated releases

Release Please owns version changes. After a release PR is merged, GitHub
Actions builds the five supported Rust binaries, creates the GitHub Release,
generates checksums, and publishes the scoped npm package.

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
