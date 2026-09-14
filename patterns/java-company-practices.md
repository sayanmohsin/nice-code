# Java practices from public engineering organizations

## Problem

Large Java users publish useful engineering lessons, but a practice observed at one company is not
automatically a universal rule. Copying a named architecture, platform, or tool can create cargo
cult complexity and ignore a project's scale, traffic, ownership model, or compatibility needs.

## Pattern

Use public company engineering material as corroborating evidence for review questions, not as a
prescriptive company-style checklist. The recurring practices supported by multiple sources are:

| Practice | Corroborating public evidence | Nice Code use |
| --- | --- | --- |
| Dependency convergence and controlled upgrades | [Spotify dependency linking](https://engineering.atspotify.com/java-linking), [Spring Boot build systems](https://docs.spring.io/spring-boot/reference/using/build-systems.html) | Review dependency graphs, version ownership, lockfiles/BOMs, and runtime compatibility. |
| Automated, repeatable migrations | [Spotify Fleet Management](https://engineering.atspotify.com/2023/4/spotifys-shift-to-a-fleet-first-mindset-part-1), [Meta Java-to-Kotlin migration](https://engineering.fb.com/2022/10/24/android/android-java-kotlin-migration/) | Review upgrade plans, codemods, validation gates, rollback, and component ownership. |
| Explicit service boundaries and integration contracts | [Netflix Simone](https://netflixtechblog.com/https-medium-com-netflix-techblog-simone-a-distributed-simulation-service-b2c85131ca1b), [LinkedIn Play](https://engineering.linkedin.com/play/play-framework-linkedin) | Review API contracts, dependency direction, storage/message boundaries, and compatibility. |
| Reliability through timeouts, retries, and idempotency | [AWS Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/), [Netflix service architecture](https://netflixtechblog.com/https-medium-com-netflix-techblog-simone-a-distributed-simulation-service-b2c85131ca1b) | Ask for bounded failure behavior and evidence; do not infer resilience from annotations alone. |
| Deterministic, behavior-focused testing | [Salesforce flaky tests](https://engineering.salesforce.com/flaky-tests-and-how-to-avoid-them-25b84b756f60/), [Spring Boot testing](https://docs.spring.io/spring-boot/reference/testing/) | Review isolation, ordering, synchronization, test scope, and failure sensitivity. |
| Null-safety and static analysis | [Uber NullAway](https://github.com/uber/NullAway), [Meta null-safety at scale](https://engineering.fb.com/2024/12/18/android/translating-java-to-kotlin-at-scale/) | Prefer configured compiler/static-analysis gates; treat annotations as evidence to verify, not proof. |
| Operational observability | [Spring Boot observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html), [Salesforce Java memory troubleshooting](https://engineering.salesforce.com/troubleshoot-memory-issues-in-your-java-apps-719b1d0f9b78/) | Review metrics, traces, logs, JVM signals, health, and reproducible performance investigations. |
| Mature tools over novelty | [Spotify boring technology](https://engineering.atspotify.com/2013/02/in-praise-of-boring-technology), [Google Java Style](https://google.github.io/styleguide/javaguide.html) | Prefer existing project tooling and explicit evidence over fashionable patterns or abstractions. |

These practices overlap with Spring Boot guidance but are not Spring-only. The review should always
state whether a recommendation is a repeated cross-source practice, a framework-specific contract,
or a project decision.

## Avoid

- Treating Netflix, Spotify, Uber, Meta, or any other company's architecture as a drop-in blueprint.
- Requiring microservices, event sourcing, hexagonal layers, or a design pattern without a demonstrated problem.
- Adding retries without timeouts, idempotency, jitter, budgets, and observability.
- Treating a passing compile or context-load test as proof of runtime compatibility or behavior.
- Turning a company blog's one-off implementation detail into an automatic failure rule.

## Example

```text
Evidence: dependency convergence is a recurring concern in Spotify's Java guidance and Spring's
build documentation.

Review: inspect this project's dependency tree, version constraints, and upgrade validation.

Decision: keep the finding as REVIEW unless a project-native enforcer, lockfile, or build rule proves
an actual violation.
```

## Enforcement

- Automated: run the project's Maven/Gradle compiler, dependency, formatter, static-analysis, and
  test tooling when configured.
- Agent review: use the evidence table to ask about boundaries, failure behavior, upgrades,
  observability, null-safety, and test determinism.
- Human decision: select the practices appropriate to the service's risk, scale, ownership, and
  compatibility constraints.

## Exceptions

A project may deliberately diverge from a public company practice. Record the local constraint,
tradeoff, owner, and validation evidence. Public examples are reference material, not exemptions
from the project's own contracts.

## Sources

- [Spotify Java dependency linking](https://engineering.atspotify.com/java-linking)
- [Spotify Fleet Management](https://engineering.atspotify.com/2023/4/spotifys-shift-to-a-fleet-first-mindset-part-1)
- [Netflix Simone](https://netflixtechblog.com/https-medium-com-netflix-techblog-simone-a-distributed-simulation-service-b2c85131ca1b)
- [Uber NullAway](https://github.com/uber/NullAway)
- [LinkedIn Play](https://engineering.linkedin.com/play/play-framework-linkedin)
- [Salesforce flaky tests](https://engineering.salesforce.com/flaky-tests-and-how-to-avoid-them-25b84b756f60/)
- [Meta null-safety at scale](https://engineering.fb.com/2024/12/18/android/translating-java-to-kotlin-at-scale/)
- [AWS Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Spring Boot observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
