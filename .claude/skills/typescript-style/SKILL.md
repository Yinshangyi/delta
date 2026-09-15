---
name: typescript-style
description: Write TypeScript and Effect code in Delta's house style. Use when writing any .ts file, and especially when reaching for an Effect API — v4 renamed enough that pre-v4 examples are actively misleading.
---

# TypeScript and Effect v4

## The v4 renames

Pinned to an exact release candidate. Every pre-v4 example, blog post and model
completion gets these wrong:

| v3 | v4 |
|---|---|
| `Either` / `Either.right` / `Either.left` | `Result` / `Result.succeed` / `Result.fail` |
| `Order.number` | `Order.Number` |
| `Order.lessThan`, `greaterThan`, … | `Order.isLessThan`, `isGreaterThan`, … |
| `yield* someEither` in `Effect.gen` | `yield* Effect.fromResult(someResult)` |

The last one compiles and **fails at runtime**: `Fiber.runLoop: Not a valid
effect`. When in doubt, read `node_modules/effect/src/**` — it is the source.

SQL lives in core: `effect/unstable/sql/{SqlClient,Migrator,SqlSchema}`.
Atoms live in `effect/unstable/reactivity/Atom`.

## Shapes

- `Effect.gen` for inline code. `Effect.fn("name")` when a tracing span helps,
  `Effect.fnUntraced` otherwise. Never write a function whose only body is a
  returned `Effect.gen`.
- Errors are `Data.TaggedError`. Commands are `Schema.TaggedClass`, declared
  inline in the port file.
- Name every `Layer` type argument. `Layer<Service, unknown>` is an erased type
  and the idiom gate rejects it: say which errors building it can produce.
- `Effect.succeed` takes a value you already have; `Effect.sync` defers work
  that can be repeated. Reaching for `succeed` where you meant `sync` is quiet
  until something needs the work done twice, or not at all.

## Values

- Money is integer cents (`Money`). Percentages are integer basis points
  (`Percentage`). Neither is ever a float — a projection is thousands of
  additions deep and terminates on `balance >= target`, where a sub-microcent
  shortfall costs a whole month.
- `Date` is banned in the domain and the linter enforces it. `LocalDate` and
  `YearMonth` are branded ISO strings; inject a clock for "now".
- Expected failures are values, not exceptions. There is a test that fails on a
  `throw` in production code.

## Files

- Directories `snake_case`, files `PascalCase.ts`.
- Import order is the formatter's job — run `pnpm format`, do not hand-sort.
- `@/` resolves to `src/`. Use it for anything outside the current folder.
