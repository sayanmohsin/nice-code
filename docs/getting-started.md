# Getting started

## Run from GitHub

```bash
git clone https://github.com/sayanmohsin/nice-code.git
cd nice-code
node scripts/nice-code.mjs --changed --project /path/to/project
```

For a local checkout of the repository itself:

```bash
node /path/to/nice-code/scripts/nice-code.mjs --changed --project .
```

The launcher uses a local release/debug engine when available and can download
the matching verified GitHub Release binary when a published release exists.
Rust is not required for normal users.

## First useful commands

```bash
nice-code --changed --project .
nice-code --all --project .
nice-code --changed --format agent --project .
nice-code --changed --ci --format sarif --project . > nice-code.sarif
```

Start with changed files. Treat full-scan findings as a review queue until the project has classified its baseline. Add `.nice-code.json` when the project needs profiles, ignored paths, severity overrides, or narrow exceptions.
