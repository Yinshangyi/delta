---
id: CAP-11
title: Net worth read model
epic: capital
status: done
size: S
depends_on: [CAP-10, CMT-06]
spec: ["§77"]
---

## Story

As a **household member**, I want **to see capital net of what we still owe** so that **a financed asset does not make me look richer than I am**.

## Acceptance criteria

- [x] `net worth = capital − Σ outstanding debt balances`
- [x] Computed for display only; never reaches `CapitalSources` or the engine
- [x] Shown beneath the headline where debts exist, and hidden entirely where none do
- [x] Capital is the headline because it drives the target date
- [x] Test: a €15,000 asset against €9,500 outstanding shows €5,500 of net equity

## Notes

Implemented as `trajectory/core/use_cases/NetWorthQuery.ts` rather than inside
`capital`, because `capital` must not know that `commitments` exists —
architecture.md's reason for keeping capital a leaf. Trajectory is the one
module allowed to see both.

Outstanding debt reaches it through its own port, separate from
`CapitalSources`, precisely so the engine has no path to the number: §77's
prohibition is enforced by there being no shape of this code in which the
subtraction could happen.

The adapters for all three ports live in `bootstrap/seams/` rather than in
`trajectory/secondary_adapters/`, because each adapts another module's use case
and an adapter importing a use case has the arrow backwards.
