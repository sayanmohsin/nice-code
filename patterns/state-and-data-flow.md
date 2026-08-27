# State and data flow

## Problem

AI-generated applications frequently duplicate derived state, put ownership in the wrong layer, or
allow several components and services to mutate the same value without a clear invariant.

## Pattern

Give each state value one owner, derive values from authoritative state when possible, make updates
explicit, and document lifecycle, persistence, synchronization, and invalidation behavior.

## Avoid

- Storing a value that can be derived from existing state.
- Synchronizing two independent copies with effects or callbacks.
- Hiding mutations in getters, render functions, or unrelated services.
- Letting client state become the authority for server-owned data.

## Example

```tsx
function Results({ items, query }) {
  const visibleItems = items.filter((item) => item.name.includes(query));
  return <List items={visibleItems} />;
}
```

## Enforcement

- Automated: use React hook rules, type checks, and framework diagnostics.
- Agent review: identify the source of truth, ownership, lifecycle, and invalidation path.
- Human decision: choose consistency, caching, and offline behavior.

## Exceptions

A persisted or memoized derived value is acceptable when measurement shows it solves a real cost and
its invalidation contract is explicit.

## Sources

- [React Rules](https://react.dev/reference/rules) — purity and immutable props/state
- [Thinking in React](https://react.dev/learn/thinking-in-react) — component hierarchy and data flow
