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

## Selection rules

- Prefer official documentation maintained by the organization responsible for the technology.
- Use public company guidance when it is specific, durable, and applicable outside that company.
- Do not turn a one-off blog opinion into a standard without corroboration.
- Record conflicts as an explicit project decision rather than silently blending incompatible rules.

## Pattern adoption metadata

This registry is the source of truth for lifecycle and enforcement metadata. Pattern documents hold
the practical guidance; this table keeps review decisions easy to audit and update.

| Pattern area | ID range | State | Technologies | Enforcement | Source sections | Last reviewed |
| --- | --- | --- | --- | --- | --- | --- |
| Logging and observability | AP-LOG | adopted | Rust, Go, TypeScript, Dart, web | automated + agent review | AWS Operational Excellence; Microsoft universal guidelines | 2026-08-26 |
| Async and concurrency | AP-ASYNC | adopted | Rust, Go, TypeScript, Dart | automated + agent review | Vercel React performance; Microsoft performance guidelines | 2026-08-26 |
| Error handling | AP-ERR | adopted | Rust, Go, TypeScript, Dart | automated + agent review | Go Code Review Comments; Google Engineering Practices | 2026-08-26 |
| Security and secrets | AP-SEC | adopted | all supported ecosystems | automated + human decision | AWS Security Pillar; MDN security guidance | 2026-08-26 |
| Testing and verification | AP-TEST | adopted | all supported ecosystems | automated + agent review | Google Engineering Practices | 2026-08-26 |
| Performance measurement | AP-PERF | adopted | all supported ecosystems | agent review + human decision | MDN Web Performance; AWS Performance Efficiency | 2026-08-26 |

Pattern IDs not listed above remain documented agent-review patterns until an executable check is
adopted. A source section name is recorded at adoption time; source URLs remain the canonical link.
