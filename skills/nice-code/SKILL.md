---
name: nice-code
description: Generic source-backed engineering guidance routed by Nice Code's detected languages and frameworks.
version: 0.3.0
license: MIT
---

# Nice Code

Use Nice Code as one generic review skill. Start with the analyzer's detected profiles, then load
general guidance, every matching language module, every matching framework module, and the
project's explicitly declared custom rules.

Detection is additive: a polyglot repository may activate Java, TypeScript, Rust, Go, Dart, and
framework profiles at the same time. Do not assume a project has only one language.

## Routing

- General engineering: `knowledge/general/engineering.md`
- Java: `skills/nice-code/languages/java.md`
- TypeScript and JavaScript: `skills/nice-code/languages/typescript.md`
- Rust: `skills/nice-code/languages/rust.md`
- Go: `skills/nice-code/languages/go.md`
- Dart: `skills/nice-code/languages/dart.md`
- Spring Boot: `skills/nice-code/frameworks/spring-boot.md`
- React: `skills/nice-code/frameworks/react.md`

Use only relevant modules. The Rust engine remains responsible for deterministic findings; this
skill supplies source-backed review guidance and context.

## Project rules

Project teams can add `.nice-code/rules/*.md` or `.nice-code/checks.json`. Only explicit rule
declarations become executable. Ordinary Markdown is advisory and is never guessed into a rule.

Use the rule authoring helper instead of hand-writing error-prone JSON:

```bash
nice-code rules init --project .
nice-code rules validate --project .
nice-code rules compile --project . --apply
```

It validates namespaced IDs, matchers, scopes, severities, and messages before compiling explicit
Markdown checks into `.nice-code/checks.json`. It never executes arbitrary commands or silently
overwrites an existing JSON rule file.

Run `nice-code --changed --project .` locally and `nice-code --changed --ci --format sarif --project .`
in CI. Pair it with the project's compiler, formatter, dependency, and test tooling.
