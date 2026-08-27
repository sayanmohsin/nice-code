# Performance measurement

## Problem

AI often applies a familiar optimization without proving that the code is on a hot path, or makes
performance claims without a baseline, workload, or measurement.

## Pattern

Define the user or system metric, establish a representative baseline, measure the relevant path,
change one meaningful variable, and compare the result. Prefer removing waterfalls, unnecessary
work, and excessive data transfer before micro-optimizing code.

## Avoid

- Adding `useMemo`, caching, or a custom allocator without evidence.
- Claiming an operation is faster without a benchmark or production metric.
- Optimizing a cold path while ignoring a measured bottleneck.

## Example

```text
Baseline: p95 request latency 420 ms over 10,000 representative requests.
Change: parallelize two independent dependency calls.
Result: p95 260 ms, error rate unchanged, resource usage within limit.
```

## Enforcement

- Automated: flag explicit performance claims without nearby measurement artifacts when practical.
- Agent review: ask for baseline, workload, metric, and regression risk.
- Human decision: choose acceptable latency, cost, and resource tradeoffs.

## Exceptions

Security or correctness fixes may proceed without a performance baseline when the risk requires
immediate action; record the missing measurement for follow-up.

## Sources

- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
- [MDN Web Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [AWS Well-Architected performance](https://docs.aws.amazon.com/wellarchitected/latest/framework/performance-efficiency.html)
