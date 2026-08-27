# Code review and AI-generated changes

## Problem

AI can repeat an existing mistake, create a plausible but unverified implementation, or make a
large change that is difficult to review and easy to misunderstand.

## Pattern

Make small changes with explicit intent, trace behavior to the source of truth, verify important
claims with tests or measurements, and review the diff for regressions and boundary violations.
Prefer a change that measurably improves code health over perfection or subjective style churn.

## Avoid

- Accepting generated code because it compiles without checking behavior.
- Combining broad formatting changes with functional changes.
- Repeating a known finding without adding a regression test or rule.
- Treating a tool warning as proof of a defect without context.

## Example

```text
Finding: two independent awaits may be sequential.
Evidence: the calls have no data dependency.
Action: verify the contract, parallelize safely, and add a regression test.
```

## Enforcement

- Automated: report recurring finding IDs and changed-file findings.
- Agent review: require evidence for correctness, performance, and architectural claims.
- Human decision: approve scope, risk, and intentional exceptions.

## Exceptions

Emergency fixes may use a narrower verification path, but the missing checks must be recorded.

## Sources

- [Google Engineering Practices](https://google.github.io/eng-practices/review/reviewer/standard.html)
- [Microsoft Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/ai/)
