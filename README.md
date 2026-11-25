# Nice Code

**Give your code a second look.**

Nice Code adds source-backed engineering checks to your terminal, coding agent, and CI. It looks for recurring mistakes and highlights questions that need human judgment, with guidance you can trace back to public sources.

[Documentation](https://sayanmohsin.github.io/nice-code/) · [Getting started](https://sayanmohsin.github.io/nice-code/getting-started) · [Pattern catalog](https://sayanmohsin.github.io/nice-code/patterns) · [CI guide](https://sayanmohsin.github.io/nice-code/ci) · [Releases](https://github.com/sayanmohsin/nice-code/releases/latest)

## Get started

Install the CLI with Node.js 20 or newer, then run it in your project:

```bash
npm install --global @sayanmohsin/nice-code
nice-code --changed --project .
```

For a one-off run:

```bash
npx --yes @sayanmohsin/nice-code --changed --project .
```

The launcher downloads and verifies the matching Rust engine and caches it locally. You don't need Rust, Cargo, or Bun to use the npm package. Prebuilt binaries for macOS, Linux, and Windows are also available in the [latest release](https://github.com/sayanmohsin/nice-code/releases/latest), alongside checksums.

## What it checks

Nice Code adds a focused review layer to the tools you already use. Its patterns cover logging and sensitive data, async and concurrency, security, error handling, APIs, persistence, testing, and more. It detects supported languages and frameworks including Rust, Go, Dart, Java, Spring Boot, TypeScript, React, Astro, and Svelte.

Findings include a location and an explanation. High-confidence critical issues can block a changed scan; `WARN` and `REVIEW` findings provide context for your decision. Full scans are advisory. See [findings and statuses](https://sayanmohsin.github.io/nice-code/findings) and the [pattern catalog](patterns/index.md) for details.

## Choose your workflow

```bash
# Review changed and untracked files (the default)
nice-code --changed --project .

# Scan the whole project deliberately
nice-code --all --project .

# Produce compact output for a coding agent
nice-code --changed --agent --include-review --project .

# Explain a check and its source
nice-code --explain AP-LOG-001
```

The checker does not modify your project during a scan. See the [CLI reference](https://sayanmohsin.github.io/nice-code/cli) for output formats, filters, and options.

## Use in CI

On GitHub Actions, Nice Code detects the comparison base for pull requests and branch pushes. Fetch the history it needs before running the check:

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0
- name: Install Nice Code
  run: npm install --global @sayanmohsin/nice-code
- name: Review changes
  run: nice-code --project . --ci
```

The runner needs Node.js 20 or newer. For another CI service, or to override automatic detection, pass `--base <commit>`. If the comparison cannot be determined reliably, Nice Code stops with a setup error. CI mode also runs available project-native tools; see the [CI guide](https://sayanmohsin.github.io/nice-code/ci) for comparison rules, SARIF output, and scheduled scans.

## Configure your project

Use the advisor to discover relevant guidance and preview project setup:

```bash
nice-code advise --project .
nice-code init --project .
nice-code init --project . --apply
nice-code skills list
```

The initializer does not overwrite existing guidance. A `.nice-code.json` file can set profiles, ignored paths, severity overrides, and narrow exceptions. Baselines help teams adopt checks gradually. See [configuration](https://sayanmohsin.github.io/nice-code/configuration), [baselines](https://sayanmohsin.github.io/nice-code/baselines), and [agent integration](https://sayanmohsin.github.io/nice-code/agent-integration).

## Contributing

The Rust engine owns discovery, analysis, and reporting. Node.js runs the launcher; Bun supports development scripts. Building the engine requires Rust 1.90 or newer. From a checkout:

```bash
npm run check:docs
npm test
node scripts/nice-code.mjs --all --project . --format json
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and pattern contribution guidance. Patterns document their problem, recommendation, examples, enforcement, exceptions, and public sources; the [source registry](sources/index.md) records their references.

## License

[MIT](LICENSE)
