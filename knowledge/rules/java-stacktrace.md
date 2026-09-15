---
id: AP-LOG-004
title: Direct stack-trace output
category: logging
scope: [java]
extensions: [java]
matcher: "\\.printStackTrace\\s*\\("
matcherType: regex
severity: warning
status: REVIEW
message: Review whether the exception is logged through the application's configured logger with context and an appropriate level.
source: https://docs.spring.io/spring-boot/4.2/reference/features/logging.html
---

Exceptions should retain their cause and be handled through the configured logging boundary.
