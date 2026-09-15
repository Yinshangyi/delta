---
id: CMT-06
title: Debt amortisation
epic: commitments
status: todo
size: M
depends_on: [CMT-04, CMT-05]
spec: ["§22", "§58"]
---

## Story

As a **developer**, I want **correct repayment arithmetic** so that **payoff dates and remaining months are trustworthy**.

## Acceptance criteria

- [ ] `next = max(0, current − payment)`
- [ ] The final payment never exceeds the remaining balance — €400 remaining pays €400, not €900
- [ ] No cash flow is produced once the balance reaches zero
- [ ] Repayment percentage, estimated payments remaining and estimated payoff date all derived
- [ ] Pure function

## Notes

§58 names the final-payment and completion cases as required tests. Write them first.
