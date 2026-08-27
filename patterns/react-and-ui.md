# React and UI behavior

## Problem

AI-generated UI code can put side effects in render, duplicate derived state, create unnecessary
effects, or move too much work into the client.

## Pattern

Keep components and hooks pure, treat props and state as immutable snapshots, derive values during
render when possible, and use effects only to synchronize with external systems. Keep data and
client boundaries intentional.

## Avoid

- Calling a component as a normal function.
- Mutating props or state.
- Using an effect to derive state that can be calculated directly.
- Loading heavy client-only dependencies for an inactive feature.

## Example

```tsx
function Results({ items }) {
  const visibleItems = items.filter((item) => item.visible);
  return <List items={visibleItems} />;
}
```

## Enforcement

- Automated: use React, TypeScript, framework, and bundle tooling where configured.
- Agent review: inspect state ownership, effect necessity, client/server boundaries, and loading UX.
- Human decision: choose interaction, accessibility, and product tradeoffs.

## Exceptions

Framework conventions may require a particular export or file shape; document the exception locally.

## Sources

- [React Rules](https://react.dev/reference/rules)
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
