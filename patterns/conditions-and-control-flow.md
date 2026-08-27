# Conditions and control flow

## Problem

AI-generated conditions can hide boundary cases, invert a business rule, perform expensive work
before an early exit, or combine unrelated decisions into one unreadable expression.

## Pattern

Name the business decision, handle cheap invalid or terminal cases early, keep branches explicit,
and make impossible states unrepresentable when the type system can express them. Test boundaries,
empty values, and both sides of every meaningful decision.

## Avoid

- Nested boolean expressions whose precedence is difficult to verify.
- Repeating the same condition in several branches.
- Performing I/O before a cheap condition can reject the request.
- Treating an unhandled enum or state as a harmless default.

## Example

```ts
if (!input.isEligible) return { status: "ineligible" };
const offer = await loadOffer(input.id);
return offer ? applyOffer(offer) : { status: "unavailable" };
```

## Enforcement

- Automated: use compiler, linter, and complexity checks where configured.
- Agent review: inspect branch completeness, ordering, readability, and boundary tests.
- Human decision: define business semantics for ambiguous or conflicting states.

## Exceptions

Compact expressions are acceptable when the condition is local, obvious, and covered by tests.

## Sources

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) — control flow and language features
- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices) — cheap conditions before async work
