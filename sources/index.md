# Source Registry

The registry contains public sources used to derive Nice Code patterns. The repository records
principles and links, not full copies of external documents.

| Organization | Source | Primary use | Reviewed |
| --- | --- | --- | --- |
| Microsoft | [Pragmatic Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/index.html) | Rust correctness, APIs, performance, docs | 2026-08-26 |
| Google | [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) | TypeScript modules and language use | 2026-08-26 |
| Google | [Engineering Practices](https://google.github.io/eng-practices/) | Review quality, tests, evidence, code health | 2026-08-26 |
| React | [Rules of React](https://react.dev/reference/rules) | React purity, state, hooks, composition | 2026-08-26 |
| Vercel | [React Best Practices](https://vercel.com/blog/introducing-react-best-practices) | React/Next.js performance | 2026-08-26 |
| Airbnb | [JavaScript Style Guide](https://airbnb.io/javascript/) | JavaScript and JSX conventions | 2026-08-26 |
| Dart | [Effective Dart](https://dart.dev/effective-dart) | Dart style, APIs, docs, design | 2026-08-26 |
| Go | [Code Review Comments](https://go.dev/wiki/CodeReviewComments) | Go review, errors, docs, formatting | 2026-08-26 |
| AWS | [Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/definitions.html) | Reliability, security, operations, cost, performance | 2026-08-26 |
| MDN | [Web Performance](https://developer.mozilla.org/en-US/docs/Web/Performance) | Browser performance and user experience | 2026-08-26 |
| Spring | [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/) | Java and Spring Boot configuration, operations, and testing | 2026-09-14 |
| Refactoring Guru | [Java design patterns](https://refactoring.guru/design-patterns/java) | Pattern catalog and Java examples | 2026-09-14 |
| DigitalOcean | [Java design patterns](https://www.digitalocean.com/community/tutorials/java-design-patterns-example-tutorial) | Java pattern examples and tradeoffs | 2026-09-14 |
| Bob Nystrom | [Design Patterns Revisited](https://github.com/munificent/game-programming-patterns/blob/master/book/design-patterns-revisited.markdown) | Contextual pattern use and alternatives | 2026-09-14 |
| Netflix | [Netflix TechBlog](https://netflixtechblog.com/https-medium-com-netflix-techblog-simone-a-distributed-simulation-service-b2c85131ca1b) | Java service boundaries, storage, messaging, and multi-region operation | 2026-09-14 |
| Spotify | [Java linking](https://engineering.atspotify.com/java-linking) and [Fleet Management](https://engineering.atspotify.com/2023/4/spotifys-shift-to-a-fleet-first-mindset-part-1) | Dependency convergence and automated runtime upgrades | 2026-09-14 |
| Uber | [NullAway](https://github.com/uber/NullAway) | Java null-safety static analysis | 2026-09-14 |
| LinkedIn | [Play Framework at LinkedIn](https://engineering.linkedin.com/play/play-framework-linkedin) | Java service framework and API development | 2026-09-14 |
| Salesforce | [Flaky tests](https://engineering.salesforce.com/flaky-tests-and-how-to-avoid-them-25b84b756f60/) | Deterministic, isolated test design | 2026-09-14 |
| Meta | [Null-safe Java at scale](https://engineering.fb.com/2024/12/18/android/translating-java-to-kotlin-at-scale/) | Static analysis and null-safety migration | 2026-09-14 |
| AWS | [Builders' Library: timeouts, retries, and backoff](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) | Bounded distributed-system failure behavior | 2026-09-14 |

## Selection rules

- Prefer official documentation maintained by the organization responsible for the technology.
- Use public company guidance when it is specific, durable, and applicable outside that company.
- Do not turn a one-off blog opinion into project guidance without corroboration.
- Record conflicts as an explicit project decision rather than silently blending incompatible rules.

## Pattern adoption metadata

This registry is the source of truth for lifecycle and enforcement metadata. Pattern documents hold
the practical guidance; this table keeps review decisions easy to audit and update.

| Pattern area | ID range | State | Technologies | Enforcement | Source sections | Last reviewed |
| --- | --- | --- | --- | --- | --- | --- |
| Logging and observability | AP-LOG | adopted | Rust, Go, TypeScript, Dart, Java, Spring Boot, web | automated + agent review | AWS Operational Excellence; Microsoft universal guidelines; Spring Boot logging | 2026-09-14 |
| Async and concurrency | AP-ASYNC | adopted | Rust, Go, TypeScript, Dart | automated + agent review | Vercel React performance; Microsoft performance guidelines | 2026-08-26 |
| Error handling | AP-ERR | adopted | Rust, Go, TypeScript, Dart | automated + agent review | Go Code Review Comments; Google Engineering Practices | 2026-08-26 |
| Security and secrets | AP-SEC | adopted | all supported ecosystems | automated + human decision | AWS Security Pillar; MDN security guidance | 2026-08-26 |
| Testing and verification | AP-TEST | adopted | all supported ecosystems | automated + agent review | Google Engineering Practices | 2026-08-26 |
| Performance measurement | AP-PERF | adopted | all supported ecosystems | agent review + human decision | MDN Web Performance; AWS Performance Efficiency | 2026-08-26 |
| Java company practices | AP-JAVA | review-only | Java, Spring Boot | agent review + human decision | Netflix, Spotify, Uber, LinkedIn, Salesforce, Meta, AWS, Spring, Google | 2026-09-14 |

Pattern IDs not listed above remain documented agent-review patterns until an executable check is
adopted. A source section name is recorded at adoption time; source URLs remain the canonical link.
