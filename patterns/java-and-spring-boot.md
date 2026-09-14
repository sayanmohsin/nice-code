# Java and Spring Boot architecture

## Problem

Java and Spring Boot applications can accumulate accidental coupling, framework-proxy surprises,
unbounded integration work, and pattern-heavy abstractions. A familiar package layout or named
design pattern does not by itself prove a sound boundary.

## Pattern

Keep dependencies directed toward the domain or use case, make external boundaries explicit, and
choose the smallest abstraction that isolates a real variation. In Spring Boot, use constructor
injection, typed external configuration, explicit transaction ownership, boundary DTOs, and tests
that match the risk. Review actuator, security, logging, async, and persistence behavior as
operational contracts. Use classic patterns as vocabulary for a demonstrated problem, not as a
template to apply mechanically.

## Avoid

- Field injection that hides required dependencies and weakens ordinary unit tests.
- Controllers containing workflows, transactions, or direct ORM/persistence decisions.
- Returning entities or provider exceptions as public API contracts.
- `@Transactional`, retry, async, or event annotations whose proxy/lifecycle semantics are not tested.
- Singleton/global mutable state, speculative factories, and interfaces with one accidental implementation.
- Committed credentials or environment-specific configuration in application code.

## Example

```java
@Service
final class OrderService {
    private final OrderRepository orders;

    OrderService(OrderRepository orders) {
        this.orders = orders;
    }

    @Transactional
    OrderView placeOrder(PlaceOrder command) {
        return OrderView.from(orders.save(Order.place(command)));
    }
}
```

## Enforcement

- Automated: parse `.java` files and run Maven/Gradle tests when the project declares those tools.
- Agent review: inspect dependency direction, proxy boundaries, API translation, configuration,
  security, operations, pattern necessity, and evidence from appropriately scoped tests.
- Human decision: approve architecture, compatibility, transaction, and deployment choices.

## Exceptions

Field injection, entity exposure, a shared singleton, or a broad pattern may be justified by a
framework boundary or migration. Document the lifetime, ownership, compatibility constraint, and
test evidence; do not treat this pattern as a blanket ban.

## Sources

- [Spring Framework annotation-based configuration](https://docs.spring.io/spring/reference/core/beans/annotation-config.html)
- [Spring Boot externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [Spring Boot production-ready features](https://docs.spring.io/spring-boot/reference/actuator/)
- [Spring testing web layer guide](https://spring.io/guides/gs/testing-web/)
- [DigitalOcean Java design patterns](https://www.digitalocean.com/community/tutorials/java-design-patterns-example-tutorial)
- [Refactoring Guru Java patterns](https://refactoring.guru/design-patterns/java)
- [Design Patterns Revisited](https://github.com/munificent/game-programming-patterns/blob/master/book/design-patterns-revisited.markdown)
