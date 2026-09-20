# Delta — working conventions

`architecture.md` is the reasoning. This file is the short list an agent needs
before touching anything. `specification.md` is the product; cite its sections
(`spec §9`) when a decision comes from it.

## Effect

**Effect v4 only.** Pinned to an exact release candidate; every `@effect/*`
package moves in lockstep and only in a dedicated commit.

v4 renamed things that every pre-v4 example, blog post and model completion
still gets wrong:

| v3 | v4 |
|---|---|
| `Either`, `Either.right`, `Either.left` | `Result`, `Result.succeed`, `Result.fail` |
| `Order.number` | `Order.Number` |
| `Order.lessThan` | `Order.isLessThan` |
| `yield* someEither` inside `Effect.gen` | `yield* Effect.fromResult(someResult)` |

The last one fails at **runtime**, not compile time. When unsure, read
`node_modules/effect/src/**` — it is the source, and it is right.

Prefer `Effect.gen` for inline code and `Effect.fn` / `Effect.fnUntraced` for
reusable functions. Never wrap a `Effect.gen` in a function that does nothing
else.

## Files and names

- Directories `snake_case`; files `PascalCase.ts`.
- Tests sit beside the code. `*.node.unit.test.ts` runs in node,
  `*.browser.unit.test.tsx` in a browser. The domain never pays for a browser.
- **Primary ports** end `*UseCase` / `*UseCases`. Never `*Port`, `*Service`,
  `*Manager`.
- **Secondary ports** are named for intent, never mechanism — no `Repository`,
  `Store`, `Cache`, or a technology name. `Holdings`, not `HoldingRepository`.
- Implementations are `*Live.ts`. Test doubles are co-located and Fowler-named
  — `*Stub`, `*Spy`, `*Fake`, `*Dummy`, `*Mock` — and expose `{ layer, inspect }`.
- **Don't over-port.** Most of Delta is a query or a one-shot command, which
  needs no port: an exported `Effect` in
  `core/use_cases/<feature>/<Name>{Query,UseCase}.ts` is enough.

## The edit gates

Four `PostToolUse` hooks run on every edit, in `tools/hooks/`: LintFix,
AstGrepCheck, BoundaryCheck, FormatFix. The first three exit 2 on a finding,
which hands it back while the context that produced it is still in the
conversation.

A fifth, `RtkRewrite`, runs `PreToolUse` on Bash: it asks `rtk rewrite` whether
a command has a cheaper equivalent and relays the answer, so `git status`
becomes `rtk git status` and its output is trimmed before it reaches the model.
Every rule lives in rtk; the hook decides nothing.

They are TypeScript, run by node directly through one bash shim. The shim
sources `nix/devshell-path.sh` first, because Claude Code is usually started
outside the dev shell and a hook that cannot find its tools skips itself in
silence — which reads exactly like a clean edit. If you see
`[devshell] … is missing`, run `direnv allow` once.

## The hexagon

Enforced by `.dependency-cruiser.cjs`, and by the BoundaryCheck hook on every
edit. If a rule fires, the import is wrong — not the rule.

- `core/**` imports no adapter, no React, no reactivity primitive.
- `primary_adapters/**` never imports `secondary_adapters/**`.
- `secondary_adapters/**` reaches core only through `core/ports/secondary/**`.
- `shared/domain/**` depends on nothing of ours but itself.
- No SQL outside `secondary_adapters/**` and `bootstrap/persistence/**`.
- No cycles.

`Atom` is primary-adapter-only. `SubscriptionRef` / `Queue` / `Mailbox` live
inside `Layer.effect` bodies and never appear in a port's signature.

## Atoms

Atoms are how React reaches Effect, and the only way — nothing renders from a
runtime directly. They live in `primary_adapters/reactivity/` and nowhere else.

Two kinds, kept apart:

- **App-state atoms** — the truth lives in `core`. Reads are
  `appRuntime.atom(query)` over an `Effect` exported from
  `core/use_cases/<feature>/<Name>Query.ts`; writes are `appRuntime.fn(...)`
  over a `*UseCase`. The atom file imports that symbol and nothing else from
  core.
- **GUI-local atoms** — state nothing else cares about: a panel open or closed,
  a selected tab. Plain `Atom.make` / `Atom.writable`, no core footprint.

Atoms resolve to `AsyncState` from `@/shared/reactivity/AsyncState` —
`resolveStream` for query atoms, `resolveMutation` for command atoms. **JSX
never imports `AsyncResult`.** Components match the five variants with
`Match.valueTags`.

**Atoms are glue.** If an atom file contains any of the following, it belongs
in a use case instead: a domain transformation, error handling that inspects a
tagged union, two port calls in sequence, id generation, or an `Effect.gen`
body longer than about three lines.

## React

- **Leaf** `Foo.tsx` — props in, JSX out. No Effect, no atoms, no hooks beyond
  local UI state.
- **Container** `FooContainer.tsx` — reads atoms, passes values down as props.
  Production callers import the container, never the leaf.
- Smart children arrive as `ReactNode` slot props.
- UI copy lives in `*Vocabulary.ts` as data and arrives as a `copy` prop, so
  currency and date formatting stay pure and testable, out of JSX.

## Domain

- Money is integer cents. Percentages are integer basis points. Neither is ever
  a float (spec §55).
- `Date` is banned in the domain and the linter enforces it. Use `LocalDate` /
  `YearMonth`; inject a clock for "now" (spec §56).
- Expected failures are values. Tagged errors, never `throw` — there is a test
  that fails on one.
- The projection engine is pure: `CashFlow[]`, a starting balance, a target, a
  horizon. It never learns that freelancers, debts or watches exist.
- Starting capital is **gross**. Debt is never subtracted from it — the
  payments already arrive as cash flows, and subtracting the balance too counts
  it twice (spec §77).

## Tests

- Write the test first. A ticket's acceptance criteria are the test names.
- Stub ports with the co-located stub or `Layer.mock`; an unused method should
  die rather than silently pass.
- Repository adapters are tested against real SQL via `DatabaseInMemory`,
  migrations included. It is real SQLite, not a fake.
- **No `vi.mock` of hooks. No `vi.hoisted`. No `createRoot`.** A component that
  needs its hooks mocked is a component that should have been a leaf with props.
- **Never test an atom through React.** Atoms and their hooks are untested glue.
  Mounting them to assert that a trigger dispatched its command re-checks the
  library, not the code. The unit under test is the use case, driven directly
  through its port. The reference project retired ~2400 lines of harness that
  proved only tautologies; do not rebuild it here.
- Assert through roles and accessible names, not DOM nodes or `container`.

## Budgets

A source file may be 200 lines, a function 40, a callback 4 deep. Components
get 400 lines and no per-function budget, because a component is one function
whose length is mostly markup. Tests are exempt: there is no number at which a
self-sufficient arrange block is too long.

The fix for a budget is always the same and always available — name it and lift
it out. Raising the number is not the fix.

## Gates, in order

    edit hook   one file      lint · idioms · boundaries · format
    pre-commit  staged files  idioms · lint · format-and-restage
    pre-push    whole tree    everything, plus the tests
    CI          whole tree    the same, on a machine nobody configured

`lefthook install` runs on dev-shell entry, so the git hooks follow the file.

## Commands

```
pnpm dev                    pnpm build
pnpm test                   pnpm test:node    pnpm test:browser
pnpm lint                   pnpm format
pnpm lint:boundaries        pnpm type-check
```

`pnpm type-check` is the real gate — `pnpm test` alone will not catch a v4
rename, because those fail at import time.
