---
id: CMT-06
title: Debt amortisation
epic: commitments
status: done
size: M
depends_on: [CMT-04, CMT-05]
spec: ["§22", "§58"]
---

## Story

As a **developer**, I want **correct repayment arithmetic** so that **payoff dates and remaining months are trustworthy**.

## Acceptance criteria

- [x] `next = max(0, current − payment)`
- [x] The final payment never exceeds the remaining balance — €400 remaining pays €400, not €900
- [x] No cash flow is produced once the balance reaches zero
- [x] Repayment percentage, estimated payments remaining and estimated payoff date all derived
- [x] Pure function

## Notes

§58 names the final-payment and completion cases as required tests. Write them first.

## Notes

The two cases §58 names were written first, and are the first two tests in the
file: €400 remaining pays €400 rather than the normal €900, and a cleared debt
produces nothing rather than billing on.
