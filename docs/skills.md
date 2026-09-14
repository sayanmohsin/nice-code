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

The bundled `java-spring-boot` skill is recommended for Java source projects and Spring Boot
projects. It provides review guidance for dependency direction, constructor injection, typed
configuration, transactions, API boundaries, operations, testing, and intentional use of design
patterns. It complements Maven, Gradle, the Java compiler, and Spring's own test support.

Projects should pin installed skills in `.nice-code/skills.lock.json`. Updates
are detected explicitly and should be applied through a reviewed diff; normal
Nice Code scans never rewrite project guidance or fetch remote skill content.

Every registry entry records its source, pinned revision, version, license,
supported ecosystems, and checked-in content path. Upstream updates must be
reviewed and incorporated into Nice Code before projects can consume them.
