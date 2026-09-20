---
id: CAP-08
title: Capital screen
epic: capital
status: done
size: M
depends_on: [CAP-04, CAP-06, CAP-07, CAP-11]
spec: ["§74"]
---

## Story

As a **household member**, I want **to see everything we own and what counts** so that **I understand what the headline figure is made of**.

## Acceptance criteria

- [x] Accounts and assets grouped separately — they are different kinds of fact
- [x] Each row shows its latest value, valuation date and inclusion toggle
- [x] Asset values carry a `~` prefix and the estimated treatment
- [x] Total capital shown, with net worth beneath it where debts exist
- [x] The target date is visible while toggling, and recomputes live
- [x] Per-holding detail shows valuation history

## Notes

Per-holding valuation history is in the detail panel, which also holds the
form to add to it (CAP-04, CAP-06).
