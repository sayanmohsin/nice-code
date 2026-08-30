# CI

Run a changed-file check on pull requests and a full scan on a scheduled audit.

```yaml
- name: Nice Code
  run: node scripts/nice-code.mjs --project . --changed --ci --format sarif > nice-code.sarif

- name: Upload Nice Code report
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: nice-code.sarif
```

Keep `REVIEW` findings visible without blocking automatically. Make a finding blocking only after it is high-confidence, non-duplicative, and useful to the project.

## Manual binary releases

Binary releases are currently created locally rather than by GitHub Actions.
Prepare each target and publish the complete set by version:

```bash
bun run release -- prepare 0.1.3
bun run release -- prepare 0.1.3 --target x86_64-apple-darwin
bun run release -- publish 0.1.3
```

The publish command refuses incomplete platform sets, creates SHA-256
checksums, and uploads the assets with `gh release create`.
