---
id: TRJ-10
title: Ahead or behind plan
epic: trajectory
status: done
size: S
depends_on: [TRJ-05]
spec: ["§16", "§33"]
---

## Story

As a **household member**, I want **to know whether we are ahead of or behind the forecast** so that **I can react before the target date drifts far**.

## Acceptance criteria

- [x] The latest actual is compared with what was forecast for that date
- [x] The variance is stated in money and in target-date movement
- [x] Ahead and behind are distinguished by more than colour
- [x] The tone stays level — behind plan is information, not failure
- [x] With no prior forecast to compare against, the state says so rather than showing zero

## Notes

The comparison is against Delta's own earlier forecast, recomputed rather than
stored: take the last capital reading from an earlier month, project forward,
and see what it said this month would hold. Nothing has to be written down in
advance and the answer cannot drift out of step with the engine, because it is
the engine.
