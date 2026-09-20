---
id: HH-11
title: Household cash flows query
epic: household
status: done
size: S
depends_on: [HH-09, HH-10]
spec: ["§13", "§29"]
---

## Story

As a **developer**, I want **one query returning the household's whole income contribution** so that **trajectory depends on a single narrow seam rather than on this module's internals**.

## Acceptance criteria

- [x] Returns `CashFlow[]` over a date range for every enabled source
- [x] Adding a new income source type requires no change outside this module
- [x] No special-casing of particular people anywhere

## Notes

The third criterion is structural rather than a test. The variant union and its
translator both live in `core/domain/IncomeCashFlows.ts`, and the query below
them only flattens — so a rental or dividend source is a new member and a new
branch in `contributionIn`, neither of which is visible from outside the
module. `secondary-no-application-layer` and `core-no-adapters` are what keep
that true as the module grows.

The seam has no consumer yet: TRJ-03 (`CashFlowSources`) is what plugs it into
the projection engine.
