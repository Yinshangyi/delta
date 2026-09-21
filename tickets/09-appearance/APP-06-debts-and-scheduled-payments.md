---
id: APP-06
title: Debts and scheduled payments
epic: appearance
status: todo
size: M
depends_on: [APP-01, CMT-12]
spec: ["§28"]
---

## Story

As a **household member**, I want **the commitments that end shown as cards with their progress** so that **I can see what is nearly paid off without opening anything**.

## Acceptance criteria

- [ ] A section headed "Debts and scheduled payments", with a note that these end rather than repeat
- [ ] A debt card: remaining of initial, a progress bar, percent repaid, monthly payment and months left
- [ ] A debt card offers "Record actual balance" in place
- [ ] A tax card: next amount, due date, a CONFIRMED or ESTIMATED badge, and what remains scheduled
- [ ] A tax card offers "See schedule"
- [ ] Estimated amounts carry ~ and never render with a confirmed amount's authority

## Notes

Replaces `CommitmentsAheadPanel`, which lists the same commitments as plain
rows. Everything the cards show is already computed — `DebtPosition` carries
remaining, percent and months left; the tax schedule carries dated rows with
their own basis (CMT-06, CMT-07).

"Record actual balance" and "See schedule" both exist on the Commitments detail
panel. Here they are entry points to the same thing, not new behaviour.
