---
id: CMT-01
title: Commitment persistence
epic: commitments
status: todo
size: M
depends_on: [FND-06, FND-10]
spec: ["§17", "§52"]
---

## Story

As a **developer**, I want **the commitment tagged union stored and retrieved** so that **every outflow type shares one seam**.

## Acceptance criteria

- [ ] `Commitments` port with a live SQLite implementation
- [ ] `RecurringExpense | OneOffExpense | Debt | TaxLiability | RecurringTaxPayment` round-trip without loss
- [ ] Integration tests against real SQL via the in-memory client
- [ ] Co-located stub exposing `{ layer, inspect }`
