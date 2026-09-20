---
id: HH-09
title: Freelance cash flow calculation
epic: household
status: done
size: M
depends_on: [HH-05, HH-06]
spec: ["§9", "§63"]
---

## Story

As a **developer**, I want **freelance income converted into dated cash flows** so that **the projection can consume it without knowing what freelancing is**.

## Acceptance criteria

- [x] `dailyRate × billableDays(M) × payoutRatio` for each active month
- [x] `€600 × 20` yields `€12,000`; at 80% that is `€9,600`
- [x] No cash flow before the start date or after the end date
- [x] A disabled source produces nothing
- [x] Pure function — no Effect, no I/O
