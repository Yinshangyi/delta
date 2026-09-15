---
id: SCN-03
title: Overridden cash flow sources
epic: scenarios
status: todo
size: M
depends_on: [SCN-01, TRJ-03]
spec: ["§35", "§36"]
---

## Story

As a **developer**, I want **a second cash flow source applying a scenario's overrides** so that **simulating runs the same engine with a different layer**.

## Acceptance criteria

- [ ] Wraps the live implementation and applies overrides in order
- [ ] Rate, billable-day, added-expense, disabled-commitment and income overrides all honoured
- [ ] The engine is unchanged and unaware a scenario is active
- [ ] Stored configuration is never mutated
