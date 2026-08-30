# Getting started

## Install the CLI

The public npm launcher requires Node.js 20 or newer. It downloads the matching
verified Rust engine automatically; users do not need Bun, Cargo, or Rust.

```bash
npm install --global @sayanmohsin/nice-code
nice-code --help
```

For a one-off invocation:

```bash
npx --yes @sayanmohsin/nice-code --changed --project .
```

Direct macOS, Linux, and Windows binaries are available from the [latest
GitHub Release](https://github.com/sayanmohsin/nice-code/releases/latest).

## Run from a local checkout

```bash
git clone https://github.com/sayanmohsin/nice-code.git
cd nice-code
npm install --global .
nice-code --changed --project /path/to/project
```

For a local checkout of the repository itself:

```bash
npm install --global /path/to/nice-code
nice-code --changed --project .
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
