---
id: FND-09
title: Typed domain errors
epic: foundations
status: done
size: S
depends_on: [FND-01]
spec: ["§54"]
---

## Story

As a **developer**, I want **expected failures modelled as typed errors** so that **no expected domain failure is ever a thrown exception**.

## Acceptance criteria

- [x] Errors are tagged classes carrying the context needed to explain the failure
- [x] Covers at least invalid money, daily rate, billable days, payout ratio, debt balance, payment schedule and goal
- [x] `PersistenceError` wraps adapter failures without leaking SQL detail into `core`
- [x] No `throw` in domain or application code
