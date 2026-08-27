# API boundaries

## Problem

AI-generated APIs often leak internal types, trust unvalidated input, return unstable error shapes,
or mix transport concerns with domain behavior.

## Pattern

Validate at the boundary, authorize before accessing protected data, translate transport types into
domain types, return a stable documented contract, and keep internal implementation details out of
public responses.

## Avoid

- Passing request objects directly into persistence.
- Returning database or provider error objects to clients.
- Allowing authentication to stand in for authorization.
- Changing response shape without a compatibility decision.

## Example

```ts
const request = parseCreateThing(input);
await requirePermission(actor, "thing:create");
const thing = await service.create(request);
return toThingResponse(thing);
```

## Enforcement

- Automated: validate schemas and run contract tests where available.
- Agent review: inspect trust boundaries, type translation, authorization, and compatibility.
- Human decision: approve public API changes and versioning policy.

## Exceptions

Internal functions may share domain types when they remain inside one trusted boundary.

## Sources

- [Microsoft Rust Guidelines](https://microsoft.github.io/rust-guidelines/guidelines/libraries/interoperability/) — library interoperability and external types
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) — public API surface
