# Monthly Nice Code audit

Nice Code is intentionally a living system. Run this review monthly for repositories that depend
on it. The audit is about evidence and useful engineering judgment, not a quality score.

## Procedure

1. Review every source URL in `sources/index.md` and record whether official guidance changed.
2. Run `nice-code --all --project /path/to/project --format json` for representative
   Rust, Go, TypeScript/React, Dart, and web projects.
3. Run `bun scripts/metrics.mts report.json` and compare status, category, file-class,
   critical, and review findings with the previous audit. Use a generated baseline
   with `--new-only` when the audit needs to distinguish accepted findings from
   findings that are currently visible.
4. Sample findings and classify false positives, useful reviews, and missing checks.
5. Compare results with Clippy, Biome, ESLint, Go vet, Dart Analyzer, compiler output, and CI.
6. Review a sample of AI-generated and human-written changes for recurring failures.
7. Add or revise a pattern only when a concrete recurring problem and approved public source exist.
8. Deprecate or reject noisy, duplicative, or unsupported patterns.
9. Record decisions, owners, source review dates, and follow-up work in a dated audit note.

## Audit record

```md
# Nice Code audit: YYYY-MM

## Repositories and reports

- Projects:
- Report locations:

## Findings

- Newly visible:
- No longer visible:
- Recurring:
- Critical:
- Review:
- False positives:

## Sources reviewed

- Source:
- Changed guidance:

## Decisions

- Patterns revised:
- Patterns proposed:
- Patterns deprecated/rejected:
- Owners and due dates:

## Next review

- Date:
```

Do not commit full reports or secrets. Keep detailed reports as local or CI artifacts and commit
only a small trend record when historical evidence is needed.
