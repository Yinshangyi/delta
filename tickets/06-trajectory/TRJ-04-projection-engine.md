---
id: TRJ-04
title: Projection engine
epic: trajectory
status: done
size: L
depends_on: [FND-02, FND-03]
spec: ["§30", "§31", "§32", "§63", "§73", "§77"]
---

## Story

As a **household member**, I want **a month-by-month projection of our savings** so that
**I know when we reach our goal**.

## Acceptance criteria

- [x] Signature is `(CashFlow[], startingCapital, target, horizon) => ProjectionResult`
- [x] Pure — no Effect, no ports, no I/O, no clock
- [x] Each month reports starting savings, income, commitments, net, ending savings,
      and the flows that produced it
- [x] Stops at the first month where ending savings reach or exceed the target
- [x] A permanently negative trajectory returns `not-reachable`, never loops
- [x] Honours a configurable maximum horizon, default 50 years
- [x] Starting capital is **gross** — outstanding debt is never subtracted (§77)
- [x] Identical inputs give identical output regardless of machine timezone
- [x] Golden-file test: one realistic household, full projection snapshotted

## Notes

`size: L` — split before starting. Natural seams: month aggregation, the accumulation
loop, and the termination/horizon rules.

The gross-capital rule is the one that will be got wrong. Subtracting debt looks like a
sensible correction, but debt already arrives as scheduled cash flows, so subtracting the
balance too understates the trajectory by the full amount owed. Write that test first.

## Notes

Split as the ticket asked: `MonthlyFlows` folds cash flows into months,
`ProjectionResult` says what an answer is, and `ProjectionEngine` is the
accumulation loop and the two ways it can stop.

Two deliberate departures. `ProjectionResult` carries no `goalId` (spec §31):
the engine is handed a target amount, which is what lets a scenario run the
same code twice against two numbers, and the caller pairs the result back with
the goal it asked about. And `NotReachable` carries a reason — past the last
dated flow the balance provably cannot move again, which is a stronger
statement than "not within fifty years" and is not merged with it.

The start month is an input rather than a clock read, which is what makes the
golden file possible at all.
