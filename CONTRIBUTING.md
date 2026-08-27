# Contributing

## Pattern requirements

Before adopting a pattern, verify that it has:

1. An approved public source.
2. A specific engineering problem.
3. A practical recommendation and counterexample.
4. An enforcement classification.
5. A checker, review procedure, or explicit reason automation is not suitable.
6. Documented exceptions.

Patterns are source-backed adaptations, not copied source documents. Preserve the source link and
section reference so the recommendation can be reviewed when upstream guidance changes.

## Lifecycle

Patterns move through `proposed`, `adopted`, `revised`, `deprecated`, or `rejected`. A proposed
pattern must not be presented as a universal rule until its source and enforcement path are
reviewed.

## Checkers

Custom checks must be conservative. Prefer `REVIEW` over a false failure when syntax alone cannot
establish intent. Add positive, negative, and ambiguous fixtures for every new detector.

Do not duplicate an existing compiler, formatter, linter, or framework rule unless the custom check
protects a higher-level engineering property that the existing tool cannot express.

Run before submitting changes:

```bash
npm run check:docs
npm test
```
