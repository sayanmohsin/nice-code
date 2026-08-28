# Getting started

## Run without installing

```bash
npx nice-code --changed --project .
bunx nice-code --changed --project .
```

For a local checkout:

```bash
node /path/to/nice-code/scripts/check.mjs --changed --project .
```

## First useful commands

```bash
nice-code --changed --project .
nice-code --all --project .
nice-code --changed --format agent --project .
nice-code --changed --ci --format sarif --project . > nice-code.sarif
```

Start with changed files. Treat full-scan findings as a review queue until the project has classified its baseline. Add `.nice-code.json` when the project needs profiles, ignored paths, severity overrides, or narrow exceptions.
