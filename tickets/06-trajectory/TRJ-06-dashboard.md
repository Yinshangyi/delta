---
id: TRJ-06
title: Dashboard
epic: trajectory
status: done
size: L
depends_on: [TRJ-04, TRJ-07, CAP-11, SHL-05]
spec: ["§37", "§64", "§77"]
---

## Story

As a **household member**, I want **one screen answering when we reach the goal** so that **I get the answer without navigating anywhere**.

## Acceptance criteria

- [x] The estimated target date dominates the composition
- [x] Total capital against the goal, with the percentage reached
- [x] Net worth beneath it where debts exist; absent where none do
- [x] Current trajectory: household income, commitments, expected monthly savings
- [x] The expected-savings figure states honestly whether scheduled tax is included
- [x] The projection chart
- [x] Commitments with a trajectory of their own — debts and upcoming tax — under a heading, with an empty case
- [x] Exactly one primary action: update balances
- [x] The target date is labelled an estimate

## Notes

`size: L` — split by tier. The expected-savings definition matters: excluding scheduled tax without saying so overstates the near-term rate several-fold.

## Notes

Expected monthly savings is two figures. A single one either hides an annual
tax bill or spreads it invisibly across twelve months, and this ticket warns
that the second overstates the near-term rate several-fold. The typical month
is the median; the average is stated beside it where they differ. Neither asks
which flows are tax — that branch is what spec §17 forbids.
