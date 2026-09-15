---
id: CMT-04
title: Debt
epic: commitments
status: todo
size: M
depends_on: [CMT-01]
spec: ["§20", "§47"]
---

## Story

As a **household member**, I want **to track a debt with its balance and payments** so that **repayment is in the forecast and I can see progress**.

## Acceptance criteria

- [ ] Name, initial amount, interest rate, payment amount, start date
- [ ] Interest rate of 0% is valid and common
- [ ] Remaining balance derives from the latest snapshot where one exists, otherwise from the initial amount
- [ ] A debt is a first-class type, not a recurring expense
