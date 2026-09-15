# Contributing

Before proposing a pattern, show the recurring problem and its public source. Add a practical example, explain enforcement and exceptions, and include positive, negative, and ambiguous fixtures where automation is involved.

```bash
npm test
npm run check:docs
npm run knowledge:check
npm run check:contributor
git diff --check
```

Run `npm run hooks:install` once to enable the repository's optional changed-path pre-commit
checks. Knowledge updates are ordinary reviewed pull requests; the scheduled workflow reports
sources that need review but does not rewrite documents.

See the repository [contribution guide](https://github.com/sayanmohsin/nice-code/blob/main/CONTRIBUTING.md) for the complete workflow.
