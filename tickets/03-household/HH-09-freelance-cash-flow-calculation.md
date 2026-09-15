---
id: HH-09
title: Freelance cash flow calculation
epic: household
status: todo
size: M
depends_on: [HH-05, HH-06]
spec: ["§9", "§63"]
---

## Story

As a **developer**, I want **freelance income converted into dated cash flows** so that **the projection can consume it without knowing what freelancing is**.

## Acceptance criteria

- [ ] `dailyRate × billableDays(M) × payoutRatio` for each active month
- [ ] `€600 × 20` yields `€12,000`; at 80% that is `€9,600`
- [ ] No cash flow before the start date or after the end date
- [ ] A disabled source produces nothing
- [ ] Pure function — no Effect, no I/O
