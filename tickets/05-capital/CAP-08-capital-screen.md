---
id: CAP-08
title: Capital screen
epic: capital
status: todo
size: M
depends_on: [CAP-04, CAP-06, CAP-07, CAP-11]
spec: ["§74"]
---

## Story

As a **household member**, I want **to see everything we own and what counts** so that **I understand what the headline figure is made of**.

## Acceptance criteria

- [ ] Accounts and assets grouped separately — they are different kinds of fact
- [ ] Each row shows its latest value, valuation date and inclusion toggle
- [ ] Asset values carry a `~` prefix and the estimated treatment
- [ ] Total capital shown, with net worth beneath it where debts exist
- [ ] The target date is visible while toggling, and recomputes live
- [ ] Per-holding detail shows valuation history
