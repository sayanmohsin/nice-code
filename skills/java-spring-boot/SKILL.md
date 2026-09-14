# Java and Spring Boot Quality

Use this skill when reviewing Java or Spring Boot changes. Treat framework conventions as
means to preserve boundaries and behavior, not as a reason to add layers or patterns by default.

## Review sequence

1. Confirm the project toolchain and run its native checks: Maven or Gradle, the configured Java
   release, formatter, compiler, tests, and static analysis.
2. Identify the boundary being changed: HTTP/controller, application service, domain, persistence,
   messaging, configuration, security, or operations.
3. Check constructor-injected dependencies, explicit transaction ownership, stable DTO/error
   contracts, validation at external boundaries, and provider/database isolation.
4. For Spring Boot, inspect component scanning, bean lifecycle, profiles, externalized
   `@ConfigurationProperties`, actuator exposure, logging context, and graceful failure.
5. Prefer focused unit and slice tests for local behavior, then integration or contract tests for
   wiring, persistence, messaging, and HTTP behavior. Do not accept a context-load test as proof
   of business behavior.
6. When citing industry practice, use `patterns/java-company-practices.md` and distinguish repeated
   cross-source evidence from a Spring contract or a project-specific decision.

## Pattern guidance

Use Factory, Strategy, Adapter, Decorator, Facade, Observer, State, and Template Method only when
they clarify a real variation, integration boundary, state transition, or algorithm. Java's
interfaces, lambdas, records, sealed types, pattern matching, and standard collection APIs may be
the simpler implementation. Flag speculative abstractions and Singleton/global state for review.

For Spring applications, review common architectural shapes such as controller-service-repository,
hexagonal/ports-and-adapters, and domain events by their dependency direction and transaction
semantics. Do not require a service layer for trivial behavior or a repository abstraction that
does not isolate a real persistence concern.

## Spring Boot checklist

- Controllers translate transport input/output and do not own persistence or business workflows.
- Request validation, authorization, idempotency, pagination, and error mapping are explicit.
- Services define use-case boundaries and transaction scope; avoid accidental self-invocation of
  proxied annotations such as `@Transactional`.
- Repositories do not leak ORM entities across public API boundaries; inspect lazy loading and
  N+1 query risk.
- Configuration is externalized and typed; secrets do not live in source or committed defaults.
- Actuator health/readiness, metrics, correlation IDs, and structured logs support operations while
  sensitive values remain redacted.
- Async, scheduling, retries, and events have bounded concurrency, delivery semantics, and tests.
- Security defaults are explicit: authentication is not authorization, and CSRF/CORS/management
  endpoints are reviewed in the deployment context.
- Dependency versions, null-safety analysis, formatter rules, and runtime upgrades are enforced by
  project-native tooling where possible; a company practice is not a substitute for local evidence.

## Evidence and exceptions

Use `REVIEW` for architectural judgment that source inspection cannot prove. Record the relevant
native tool output and test scope. A deliberate deviation is acceptable when the code documents the
boundary, lifetime, ownership, and reason for the exception.

## Sources

- [Spring Boot externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [Spring Boot production-ready features](https://docs.spring.io/spring-boot/reference/actuator/)
- [Spring Framework annotation-based configuration](https://docs.spring.io/spring/reference/core/beans/annotation-config.html)
- [Spring testing web layer guide](https://spring.io/guides/gs/testing-web/)
- [Spring AI generic agent skills](https://spring.io/blog/2026/01/13/spring-ai-generic-agent-skills/)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Spring Boot logging](https://docs.spring.io/spring-boot/4.2/reference/features/logging.html)
- [SLF4J parameterized logging](https://exo1.slf4j.org/manual/architecture.html)
- [Java practices from public engineering organizations](https://github.com/sayanmohsin/nice-code/blob/main/patterns/java-company-practices.md)
- [DigitalOcean Java design patterns](https://www.digitalocean.com/community/tutorials/java-design-patterns-example-tutorial)
- [Refactoring Guru Java patterns](https://refactoring.guru/design-patterns/java)
- [Design Patterns Revisited](https://github.com/munificent/game-programming-patterns/blob/master/book/design-patterns-revisited.markdown)
