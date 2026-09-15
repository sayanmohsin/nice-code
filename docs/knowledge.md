# Knowledge and project-owned rules

Nice Code has two separate resource surfaces.

The package-owned knowledge base lives in the Nice Code repository under
`knowledge/`, `patterns/`, `skills/`, and `sources/`. Its registry and review dates are
maintainer concerns. Contributors run `npm run knowledge:compile`, `npm run knowledge:check`,
`npm run knowledge:outdated`, and `npm run check:contributor`; ordinary projects do not need
these commands.

Projects may attach their own guidance and safe deterministic checks without modifying Nice Code:

```text
.nice-code/
  checks.json
  rules/team-java.md
  resources/architecture.md
```

`.nice-code/checks.json` is the explicit format. A Markdown rule file can declare the same checks in
front matter, so teams can write prose guidance and checks together. IDs must begin with
`CUSTOM-`, and matchers are literal by default or `regex` when `matcherType` is set. Checks are
scoped by file extension and detected profile, and test files are skipped unless
`includeTests` is true.

The equivalent JSON rule is:

```json
{
  "checks": [
    {
      "id": "CUSTOM-ACME-001",
      "title": "Avoid legacy dates",
      "matcher": "java.util.Date",
      "extensions": ["java"],
      "appliesTo": ["java", "spring-boot"],
      "severity": "warning",
      "message": "Use java.time APIs instead."
    }
  ]
}
```

Project Markdown resources are advisory context only; they are never merged into Nice Code's
trusted knowledge registry. Nice Code does not execute project shell commands as custom rules.

## Developer rule authoring

Developers can use the bundled authoring helper instead of hand-writing JSON:

```bash
nice-code rules init --project .
nice-code rules validate --project .
nice-code rules compile --project . --apply
```

Only explicit checks in `.nice-code/rules/*.md` are compiled. Validation rejects malformed IDs,
matchers, scopes, severities, and messages. Existing `checks.json` files are never silently
overwritten.

Use `nice-code --changed --project .` locally and `nice-code --changed --ci --format sarif
--project .` in CI. Pair it with the project's compiler, formatter, dependency analysis, and test
commands.
