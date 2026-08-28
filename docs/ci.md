# CI

Run a changed-file check on pull requests and a full scan on a scheduled audit.

```yaml
- name: Nice Code
  run: node scripts/check.mjs --project . --changed --ci --format sarif > nice-code.sarif

- name: Upload Nice Code report
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: nice-code.sarif
```

Keep `REVIEW` findings visible without blocking automatically. Make a finding blocking only after it is high-confidence, non-duplicative, and useful to the project.
