---
id: CMT-04
title: Debt
epic: commitments
status: done
size: M
depends_on: [CMT-01]
spec: ["§20", "§47"]
---

## Story

As a **household member**, I want **to track a debt with its balance and payments** so that **repayment is in the forecast and I can see progress**.

## Acceptance criteria

- [x] Name, initial amount, interest rate, payment amount, start date
- [x] Interest rate of 0% is valid and common
- [x] Remaining balance derives from the latest snapshot where one exists, otherwise from the initial amount
- [x] A debt is a first-class type, not a recurring expense

## Notes

The interest rate is recorded and round-trips, and 0% is valid — but V1's
projection does not compound it. Spec §22 defines the arithmetic as
`max(0, current − payment)` and leaves compounding unspecified, and a
convention Delta invented would be a wrong number carrying the same confidence
as a right one. A debt with a non-zero rate says so in its detail panel rather
than overstating progress silently.
