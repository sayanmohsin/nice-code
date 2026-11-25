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

## Dependency upgrades and compatibility

The engine now requires Rust 1.90 for Tree-sitter 0.27. The published launcher retains Node 20
support; the documentation build requires Node 20.19+ or 22.12+. Use pnpm 12.23.0 for documentation
installs. CI tests the launcher's minimum Node version and the engine's minimum Rust version.

VitePress 1.6.4 is the latest stable release used here. Its transitive Vite and Vue plugin are
overridden together in `pnpm-workspace.yaml` to use Vite 8 and plugin-vue 6. Older Vite 5 packages
report security advisories. The esbuild override keeps all resolutions on the updated release too.

Vite 8 uses Rolldown, which requires generated assets to use `emitFile`. A small pnpm patch updates
VitePress's lean page-module emission to that API; see the
[Vite migration guide](https://vite.dev/guide/migration) and
[Rolldown plugin guidance](https://rolldown.rs/guide/advanced/plugin-api).
Remove the patch when a stable VitePress release supports that API directly. The documentation
build verifies that every page has both full and lean modules, so a successful bundler exit cannot
hide missing navigation assets.

Refresh manifests, overrides, patches, and lockfiles together. Keep compatible transitive ranges
where upstream APIs require them, and validate upgrades with a frozen install, formatting, build,
and browser navigation/search checks. Do not use prereleases to satisfy stable upgrade checks.
