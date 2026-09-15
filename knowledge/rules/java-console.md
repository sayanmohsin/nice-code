---
id: AP-LOG-003
title: Unstructured Java console output
category: logging
scope: [java]
extensions: [java]
matcher: "System\\.(out|err)\\."
matcherType: regex
severity: warning
status: REVIEW
message: Review whether console output should use the application's configured structured logger with context and an appropriate level.
source: https://docs.spring.io/spring-boot/4.2/reference/features/logging.html
---

Direct Java console output is a review concern in production code.
