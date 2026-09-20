---
id: SCN-05
title: Time cost comparison
epic: scenarios
status: done
size: M
depends_on: [SCN-03, SCN-04, TRJ-04]
spec: ["§36", "§64"]
---

## Story

As a **household member**, I want **the time impact of a change** so that **decisions are expressed in months, not just euros**.

## Acceptance criteria

- [x] Runs the same projection under the live and overridden layers and diffs the target dates
- [x] No hard-coded conversion between money and time anywhere
- [x] Reports direction and magnitude: 3 months sooner, 2 months later
- [x] Where several overrides are stacked, the net effect is decomposed per change
- [x] An unreachable baseline or simulation is handled without a spurious number

## Notes

The decomposition — "the holiday costs 1 month; the rate rise buys 4 back" — is the most useful output in the product. Design for it rather than bolting it on.

## Notes

`n + 1` projections for `n` changes: the baseline, then each change stacked on
the ones before it. The decomposition is therefore honest about order — the
holiday's cost is measured with the rate rise already applied, because that is
how the household is considering them.

An unreachable step reports no number rather than one invented from nothing.
"It never gets there" is not "it costs 0 months".
