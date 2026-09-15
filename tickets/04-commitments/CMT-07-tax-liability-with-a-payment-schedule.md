---
id: CMT-07
title: Tax liability with a payment schedule
epic: commitments
status: todo
size: M
depends_on: [CMT-01]
spec: ["§24", "§25", "§26", "§48"]
---

## Story

As a **household member**, I want **to record a tax bill and its exact payment dates** so that **uneven instalments land in the right months**.

## Acceptance criteria

- [ ] Name, tax year, confirmed or estimated status, total amount
- [ ] An explicit schedule of dated amounts, variable length, rows addable and removable
- [ ] The schedule is never collapsed into a monthly average
- [ ] €5,303, €5,303, €5,303, €5,306 land on their configured dates exactly
- [ ] Estimated liabilities are visually distinguished from confirmed ones

## Notes

§25 exists because real schedules have an uneven final instalment. A `monthlyAmount` field would be a bug.
