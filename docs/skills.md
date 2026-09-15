# Skills

Nice Code maintains a curated, versioned registry of agent and reviewer
guidance in the repository's `skills/` directory. Skills are separate from
executable findings: a skill helps an agent reason about a change, while the
Rust engine reports source-backed findings.

```bash
nice-code skills list
nice-code skills show web-interface
nice-code skills check
nice-code skills outdated --project .
nice-code skills update --project .
nice-code skills update --project . --apply
```

The bundled generic `nice-code` skill is recommended for every project. It routes to Java, Spring
Boot, web, and other language/framework guidance based on detected profiles. The former
`java-spring-boot`, `web-interface`, and `design-system` entries remain compatibility aliases.

The skill does not convert arbitrary prose into executable rules. Maintainers explicitly declare
deterministic rules in knowledge Markdown and run `npm run knowledge:compile`; the Rust engine
then consumes the generated JSON.

Projects should pin installed skills in `.nice-code/skills.lock.json`. Updates
are detected explicitly and should be applied through a reviewed diff; normal
Nice Code scans never rewrite project guidance or fetch remote skill content.

Every registry entry records its source, pinned revision, version, license,
supported ecosystems, and checked-in content path. Upstream updates must be
reviewed and incorporated into Nice Code before projects can consume them.
