---
id: CMT-01
title: Commitment persistence
epic: commitments
status: done
size: M
depends_on: [FND-06, FND-10]
spec: ["§17", "§52"]
---

## Story

As a **developer**, I want **the commitment tagged union stored and retrieved** so that **every outflow type shares one seam**.

## Acceptance criteria

- [x] `Commitments` port with a live SQLite implementation
- [x] `RecurringExpense | OneOffExpense | Debt | TaxLiability | RecurringTaxPayment` round-trip without loss
- [x] Integration tests against real SQL via the in-memory client
- [x] Co-located stub exposing `{ layer, inspect }`

## Notes

Writing the cascade test here found that no SQLite connection had ever enforced
a foreign key — they are off by default and on per connection — so every
`ON DELETE CASCADE` written before this ticket was decorative. The pragma now
runs where the client is built, and `ForeignKeys.node.unit.test.ts` pins it.
