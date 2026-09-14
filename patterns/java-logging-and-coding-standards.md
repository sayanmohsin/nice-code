# Java logging and coding standards

## Problem

Java teams can lose production context through direct console output, eagerly concatenated log
messages, inconsistent exception handling, and style drift that makes reviews and tooling less
reliable. A style guide should improve readability and tooling compatibility without pretending to
settle project-specific design choices.

## Pattern

Use the project's configured logging facade and backend, normally Spring Boot's default logging
setup or SLF4J-compatible APIs. Prefer parameterized messages, stable event meaning, appropriate
levels, request or correlation context, and the exception as the final cause-bearing argument.
Redact secrets and sensitive payloads before they reach logging. Use `System.out`, `System.err`,
and `printStackTrace()` only for an explicitly documented command-line or test boundary.

For source style, select one enforced guide and make the formatter authoritative. The Google Java
Style Guide is a useful baseline: UTF-8, one top-level class per file, explicit package/import
structure, no wildcard imports, consistent braces/indentation, bounded line length, conventional
naming, `@Override` where applicable, and no silently ignored caught exceptions.

## Avoid

```java
System.out.println("payment failed " + cardNumber);
exception.printStackTrace();
logger.info("user=" + userId + " amount=" + amount);
```

Prefer a configured logger and preserve the cause:

```java
logger.warn("payment authorization failed for userId={} amount={}", userId, amount, exception);
```

## Example

```java
private static final Logger LOGGER = LoggerFactory.getLogger(PaymentService.class);

void authorize(String userId, BigDecimal amount) {
    try {
        gateway.authorize(userId, amount);
        LOGGER.info("payment.authorized userId={} amount={}", userId, amount);
    } catch (GatewayException exception) {
        LOGGER.warn("payment.authorization_failed userId={}", userId, exception);
        throw new PaymentAuthorizationException("payment authorization failed", exception);
    }
}
```

## Enforcement

- Automated: use the project formatter and static-analysis tools; Nice Code reviews obvious direct
  console and stack-trace output and secret-bearing logging.
- Agent review: check log levels, parameterization, context, redaction, exception causes, naming,
  imports, package structure, `@Override`, and ignored exceptions.
- Human decision: choose the project's style guide, event taxonomy, retention policy, and allowed
  command-line output boundaries.

## Exceptions

CLI output, migration progress, test diagnostics, and startup failures may intentionally write to
standard streams. Keep those paths isolated, avoid secrets, and document why the configured logger
is unavailable or inappropriate.

## Sources

- [Spring Boot logging](https://docs.spring.io/spring-boot/4.2/reference/features/logging.html)
- [SLF4J parameterized logging](https://exo1.slf4j.org/manual/architecture.html)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
