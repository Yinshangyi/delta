---
name: hexagonal-placement
description: Decide where a new file, type, port or piece of state belongs in Delta's hexagon. Use when creating anything under src/modules/**, when naming a port, when a port is about to expose a SubscriptionRef or an Atom, or when dependency-cruiser rejects an import and the fix is not obvious.
---

# Where does this go?

Delta is five vertical slices, each a complete hexagon:

```
modules/<name>/
  core/
    domain/            value objects, entities, pure calculations
    ports/primary/     what the app can do        (*UseCase / *UseCases)
    ports/secondary/   what the app needs         (intent-named)
    use_cases/         interactors
  primary_adapters/
    react/             leaf + container components
    reactivity/        atoms — and nowhere else
  secondary_adapters/  *Live.ts + co-located test doubles
  Dependencies.ts      <module>AdaptersLayer, <module>UseCasesLayer
```

## The decision

Ask **who owns this behaviour**, not what technology implements it.

| It is… | It goes in |
|---|---|
| a rule that would still be true on paper | `core/domain/` |
| something the app can be asked to do | `core/ports/primary/` + `core/use_cases/` |
| something the app needs from outside | `core/ports/secondary/` |
| how that outside thing actually works | `secondary_adapters/` |
| how a person drives it | `primary_adapters/react/` |
| what the screen currently shows | `primary_adapters/reactivity/` |
| vocabulary every module speaks | `shared/domain/` |

**Don't over-port.** Most of Delta is a query or a one-shot command, which needs
no port at all — an exported `Effect` in
`core/use_cases/<feature>/<Name>{Query,UseCase}.ts` is enough. A port earns its
place when there is a second implementation, or when the thing behind it is I/O.

## Naming

- Primary ports end `*UseCase` / `*UseCases`. Never `*Port`, `*Service`, `*Manager`.
- Secondary ports are named for **intent**: `Holdings`, `SavingsHistory`, `Goals`.
  Never `Repository`, `Store`, `Cache`, or a technology name. This deliberately
  amends spec §52.
- Implementations are `*Live.ts`. Doubles are Fowler-named and co-located —
  `*Stub`, `*Spy`, `*Fake`, `*Dummy`, `*Mock` — and expose `{ layer, inspect }`.

## State placement

`Atom` is a primary-adapter concept. It never appears in `core/`.

`SubscriptionRef`, `Queue` and `Mailbox` live **inside** a `Layer.effect` body
and never appear in a port's type signature. A port that exposes one has leaked
its implementation: the caller now depends on *how* the state is held, and every
test of that caller has to construct one.

## When the boundary guard fires

`.dependency-cruiser.cjs` is the authority; `architecture.md` is its reasoning.
If a rule fires, the import is wrong — not the rule. The usual fixes:

- core importing an adapter → invert it: define a secondary port, let the
  adapter implement it, wire both in `Dependencies.ts`.
- a component importing a secondary adapter → the two sides of the hexagon meet
  at the composition root, not in a component. Go through an atom.
- shared/domain importing a module → the thing is not shared. Move it into the
  module that owns it.
- a cycle → the two files are one unit that has not admitted it yet, or one of
  them is holding a type that belongs in `shared/domain/`.
