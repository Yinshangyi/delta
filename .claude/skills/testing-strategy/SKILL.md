---
name: testing-strategy
description: Decide what to test and how in Delta. Use before writing a test, when choosing between the node and browser projects, when a test needs a database, or when a test is about to mock something.
---

# Testing

**Write the test first.** A ticket's acceptance criteria are the test names —
if an AC cannot be phrased as a test, it is not yet a criterion.

## Which project

| Suffix | Runs in | For |
|---|---|---|
| `*.node.unit.test.ts` | node | domain, use cases, adapters |
| `*.browser.unit.test.tsx` | headless chromium | components |

The domain is pure functions over arrays and never pays for a browser.

## Doubles

Co-located, Fowler-named, exposing `{ layer, inspect }`:

```ts
const stub = makeHoldingsStub({ holdings: [...] })
// … provide stub.layer …
expect(stub.inspect().writes).toBe(1)
```

Stub ports with those or with `Layer.mock`, where an unused method **dies**
rather than silently passing. A test that passes because a method was never
called is a test that proves nothing.

**No `vi.mock` of hooks. No `vi.hoisted`. No `createRoot`.** A component that
needs its hooks mocked should have been a leaf taking props.

**Never test an atom through React.** An atom plus its `useFoo` hook is glue: a
runtime call and a wrapper around `useAtomSet`. Mounting it with a registry
provider and Testing Library, to assert that pressing the button dispatched the
command, tests the library rather than the code — and the harness costs more
than everything it covers. The unit under test is the **use case**, acquired
through its port and driven directly, with a co-located stub standing in for
its dependencies.

## Databases are real

Repository adapters run against `DatabaseInMemory` — the same wasm SQLite over
a memory VFS, with migrations applied. Real constraints, real SQL errors, a
fresh empty database per layer build, no teardown. It is not a fake, and tests
should fail the way production would.

`@effect/vitest`'s `layer(MyLayer)("name", (it) => it.effect(...))` memoises the
layer across a describe. When a test is *about* building the layer twice, drop
back to plain vitest — memoisation is exactly what that test is checking.

## Properties, not just examples

Arithmetic laws are properties over a range, not three examples. `fast-check`
is there for associativity, round-trips, inverses and invariants. Use it where a
law exists; do not decorate ordinary cases with it.

## The engine

`ProjectionEngine` is tested as pure functions over arrays — no database, no
React — plus a golden-file test: one realistic household, its full projection
snapshotted, so an accidental arithmetic change shows up as a diff.

The case that matters most is an **exactly reachable** goal. That boundary is
the entire reason money is integer cents.
