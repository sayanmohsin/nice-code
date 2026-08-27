# Testing and verification

## Problem

AI can produce tests that mirror implementation details, assert constants against themselves, or
pass while the intended behavior is broken.

## Pattern

Test observable behavior, important failure modes, and boundaries. A useful test should fail when
the behavior it protects regresses. Choose unit, integration, contract, or end-to-end scope based
on the risk being protected.

## Avoid

```ts
expect(CHECKPOINTS).toEqual([0, 90, 180, 270]);
```

when the test only repeats the declaration and proves no behavior.

## Example

```ts
expect(distanceBetweenCheckpoints(CHECKPOINTS)).toBe(90);
```

## Enforcement

- Automated: flag tautological assertions and tests that contain no meaningful assertion.
- Agent review: verify failure sensitivity, boundary cases, and test scope.
- Human decision: set risk-based coverage and release gates.

## Exceptions

Snapshot or schema tests may assert exact data when that data is itself the contract.

## Sources

- [Google Engineering Practices](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
- [Microsoft Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/ai/)
