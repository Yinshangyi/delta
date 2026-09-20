# Delta — Architecture

A local-first household financial trajectory engine. Given where you are and what you
earn, spend and owe, it answers: **when do you reach your goal?**

See `specification.md` for the product and domain specification. This document covers
structure only.

---

## Stack

| Concern | Choice | Note |
|---|---|---|
| Language | TypeScript | |
| Core | `effect` v4 (release candidate, pinned exact) | Whole `@effect/*` set moves in lockstep; upgrade in dedicated commits |
| Build / dev | Vite | Plain React SPA — **no Next.js**, no SSR, no router framework |
| UI | React 19 | |
| UI state | `@effect/atom-react` | Primary adapters only |
| Database | `@effect/sql-sqlite-wasm` + OPFS worker | Real SQLite; data never leaves the device |
| Test database | `SqliteClient.makeMemory` | In-memory, deterministic |
| Migrations | `SqliteMigrator` | Schema is global → lives in `bootstrap/` |
| Styling | Tailwind | |
| Charts | Hand-drawn SVG from pure geometry | TRJ-07's criteria — straight segments, no area fill, fixed tick interval, greyscale-legible — are all restraint, and each would fight a library's defaults. `TrajectoryCurve` is unit-tested; the component only renders it |
| Tests | Vitest + `@effect/vitest` | |
| Boundaries | dependency-cruiser | CI gate + Claude `PostToolUse` hook |

**Deferred, deliberately:** desktop packaging (Tauri/Electron), any backend, auth, sync.
The layering below is what keeps those deferrable.

---

## Layering

Hexagonal (Cockburn) + the dependency rule (Martin). **Source dependencies point inward.**

```
core/
  domain/              value objects, entities, pure calculations — no Effect runtime, no I/O
  ports/primary/       driving ports — what the app can do, called by primary adapters
  ports/secondary/     driven ports — what the app needs, implemented by secondary adapters
  use_cases/           interactors; orchestrate ports
primary_adapters/
  react/components/    leaf (.tsx) + container (Container.tsx)
  reactivity/          atoms — and nowhere else
secondary_adapters/
  persistence/         *Live.ts implementations + co-located test doubles
Dependencies.ts        exports <module>AdaptersLayer and <module>UseCasesLayer
```

Rules the linter enforces:

- `core/**` may not import adapters, React, or any reactivity primitive.
- `primary_adapters/**` may import `core/**`, never `secondary_adapters/**`.
- `secondary_adapters/**` may import `core/ports/secondary/**` only.
- No cycles, between modules or within them.

`Atom` is primary-adapter-only. `SubscriptionRef` / `Mailbox` / `Queue` live *inside*
`Layer.effect` bodies and never appear in a port's type signature.

---

## Modules

Four vertical slices, each a complete hexagon.

```
shared/domain/     Money (integer cents) · YearMonth · LocalDate · Percentage · CashFlow

modules/
  household/       people · income sources · TJM · billable days · payout ratio
  commitments/     recurring · one-off · debt (+ snapshots) · tax (+ schedules)
  capital/         bank accounts · physical assets · valuations · inclusion
  trajectory/      goals · ProjectionEngine · recalibration
  scenarios/       overrides · baseline-vs-simulation · time cost

bootstrap/         migrations · app runtime · layer composition
```

```
   household ──┐
   commitments ─┼──► trajectory ──► scenarios
   capital ────┘
         ▲                             │
         └─────────────────────────────┘
              (overrides re-read config)
```

**Why `capital` is separate but the recalibration workflow is not.** Splitting naively
recreates a cycle: the projection needs total capital as its starting balance, while the
"update balances" workflow needs a projection to report the moved target date. The
resolution is the same as everywhere else here — `capital` is pure holdings and valuations
with no downstream knowledge, and the recalibration workflow (record a balance → recompute
→ report the moved date) lives in `trajectory`, which depends on it. That loop *is* the
product (spec §2.3, §74).

**Why goals live in `trajectory`.** A goal is only a projection's terminating condition.
Alone it is a name and a number.

**Not modules:** debt and tax live in `commitments` (spec §28 — one Commitments section);
goals live in `trajectory` (a goal is only a projection's terminating condition); the
dashboard and chart are `trajectory/primary_adapters`.

---

## The two seams

### 1. Every module produces its own cash flows

`CashFlow` lives in `shared/domain/`. Each module exports its own contribution:

```
household/core/use_cases/HouseholdCashFlowsQuery.ts      → Effect<CashFlow[]>
commitments/core/use_cases/CommitmentCashFlowsQuery.ts   → Effect<CashFlow[]>
```

Freelance arithmetic stays in `household`. Debt amortisation — including "the final
payment never exceeds the remaining balance" — stays in `commitments`.

`trajectory` depends on exactly one secondary port:

```ts
CashFlowSources: {
  readonly between: (from: YearMonth, to: YearMonth) => Effect<ReadonlyArray<CashFlow>, LoadError>
}
```

The engine takes `CashFlow[]`, a starting balance, a target and a horizon. It never learns
that freelancers, debts or tax schedules exist. Adding rental income means one new
translator inside `household`; the engine is untouched (spec §7, §17).

### 1b. Capital enters through one port too

`trajectory` asks `capital` a single question, mirroring `CashFlowSources`:

```ts
CapitalSources: {
  readonly totalAt: (date: LocalDate) => Effect<Money, LoadError>
}
```

The implementation sums the latest valuation of each **included** holding. The engine never
learns that bank accounts and watches are different things — it receives a starting balance.
Adding investment accounts or property in V2 is one new holding variant inside `capital`.

Holdings are a tagged union (`BankAccount | PhysicalAsset`), the same shape as
`IncomeSource` and `FinancialCommitment`. A physical asset's valuation carries
`basis: "estimated"`, which the UI is required to surface (spec §70, §26).

**Net worth is a read model, never an engine input.** `Capital − Σ outstanding debt` is
computed for display by a query that spans `capital` and `commitments`. It must not reach
`CapitalSources` — debt already enters the projection as scheduled cash flows, so
subtracting balances too would count it twice and push the target date out by the full
amount owed (spec §77). The engine's starting balance is gross capital, always.

### 2. A scenario is a swapped layer

`scenarios` supplies a *second* `CashFlowSources` implementation that wraps the live one
and applies `ScenarioOverride[]`. Time cost is then a diff of two runs of the same code:

```ts
const baseline   = project.pipe(Effect.provide(CashFlowSourcesLive))
const simulation = project.pipe(Effect.provide(OverriddenCashFlowSources(overrides)))
```

Which is what spec §36 requires — the impact always comes from comparing two
`ProjectionResult`s, never from a formula.

---

## Naming

- Directories `snake_case`; files `PascalCase.ts`.
- **Primary ports** end in `*UseCase` / `*UseCases`. Never `*Port`, `*Service`, `*Manager`.
- **Secondary ports** are named for intent, not mechanism — no `Repository`, `Store`,
  `Cache`, or technology names. This amends spec §52.

  | Spec §52 | Here |
  |---|---|
  | `HouseholdRepository` | `HouseholdConfiguration` |
  | `CommitmentRepository` | `Commitments` |
  | `SavingsRepository` | `SavingsHistory` |
  | `DebtRepository` | `DebtHistory` |
  | `GoalRepository` | `Goals` |
  | *(new)* | `Holdings` |
  | *(new)* | `ValuationHistory` |

- Implementations are `*Live.ts`. Test doubles are Fowler-named and co-located:
  `*Stub`, `*Spy`, `*Fake`, `*Dummy`, `*Mock`.
- Commands are `Schema.TaggedClass`, declared inline in the port file.

**Don't over-port.** Most of Delta is a query or a one-shot command, which needs no port —
an exported `Effect` in `core/use_cases/<feature>/<Name>{Query,UseCase}.ts` is enough.
`ReactiveCommandState<State, Command, Error>` is warranted in one place: the scenario
builder, which is a genuine domain state machine.

---

## React

- **Leaf** `Foo.tsx` — props in, JSX out. No hooks beyond local UI state, no Effect, no atoms.
- **Container** `FooContainer.tsx` — reads atoms, forwards values as props. Production
  callers import the container, never the leaf.
- Smart children arrive as `ReactNode` slot props.
- UI copy lives in `*Vocabulary.ts` as data, passed in as a `copy` prop — currency and date
  formatting stay pure and testable, out of JSX.

---

## Testing

| Scope | File | Runs in |
|---|---|---|
| Domain + use cases | `*.node.unit.test.ts` | node |
| Components | `*.browser.unit.test.tsx` | browser |

- The `ProjectionEngine` is tested as pure functions over arrays — no database, no React
  (spec §57). It carries a **golden-file test**: one realistic household, its full
  projection snapshotted, so accidental arithmetic changes surface as a diff.
- Repository adapters are tested against real SQL via `makeMemory`, migrations included.
- Ports are stubbed with `Layer.mock`; unused methods die rather than silently pass.
- No `vi.mock` of hooks. No `vi.hoisted`. No `createRoot`.

---

## Durability

OPFS can be evicted by the browser under storage pressure, and Delta's data is
hand-entered. Therefore, in V1, not V2:

- `navigator.storage.persist()` at boot.
- `ExportDatabaseUseCase` / `ImportDatabaseUseCase` over the wasm client's
  `export` / `import`, surfaced in Settings as a visible backup action.

This is also the migration path onto a future desktop build.
