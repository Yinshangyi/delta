---
id: CAP-10
title: Capital sources query
epic: capital
status: done
size: S
depends_on: [CAP-02, CAP-07]
spec: ["§73", "§77"]
---

## Story

As a **developer**, I want **one query returning total capital at a date** so that **the engine receives a starting balance and nothing else**.

## Acceptance criteria

- [x] `totalAt(date)` sums the latest valuation of each included holding
- [x] Excluded and disabled holdings contribute nothing
- [x] Outstanding debt is never subtracted — the engine's starting balance is gross
- [x] A holding with no valuation contributes zero, not an error
- [x] All holdings excluded yields €0

## Notes

The gross-capital rule is the one most likely to be got wrong. Debt already enters as scheduled cash flows; subtracting balances too would double-count and push the target date out by the full amount owed.
