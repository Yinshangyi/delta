---
id: HH-11
title: Household cash flows query
epic: household
status: todo
size: S
depends_on: [HH-09, HH-10]
spec: ["§13", "§29"]
---

## Story

As a **developer**, I want **one query returning the household's whole income contribution** so that **trajectory depends on a single narrow seam rather than on this module's internals**.

## Acceptance criteria

- [ ] Returns `CashFlow[]` over a date range for every enabled source
- [ ] Adding a new income source type requires no change outside this module
- [ ] No special-casing of particular people anywhere
