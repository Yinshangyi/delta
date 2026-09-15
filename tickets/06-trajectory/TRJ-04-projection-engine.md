---
id: TRJ-04
title: Projection engine
epic: trajectory
status: todo
size: L
depends_on: [FND-02, FND-03]
spec: ["§30", "§31", "§32", "§63", "§73", "§77"]
---

## Story

As a **household member**, I want **a month-by-month projection of our savings** so that
**I know when we reach our goal**.

## Acceptance criteria

- [ ] Signature is `(CashFlow[], startingCapital, target, horizon) => ProjectionResult`
- [ ] Pure — no Effect, no ports, no I/O, no clock
- [ ] Each month reports starting savings, income, commitments, net, ending savings,
      and the flows that produced it
- [ ] Stops at the first month where ending savings reach or exceed the target
- [ ] A permanently negative trajectory returns `not-reachable`, never loops
- [ ] Honours a configurable maximum horizon, default 50 years
- [ ] Starting capital is **gross** — outstanding debt is never subtracted (§77)
- [ ] Identical inputs give identical output regardless of machine timezone
- [ ] Golden-file test: one realistic household, full projection snapshotted

## Notes

`size: L` — split before starting. Natural seams: month aggregation, the accumulation
loop, and the termination/horizon rules.

The gross-capital rule is the one that will be got wrong. Subtracting debt looks like a
sensible correction, but debt already arrives as scheduled cash flows, so subtracting the
balance too understates the trajectory by the full amount owed. Write that test first.
