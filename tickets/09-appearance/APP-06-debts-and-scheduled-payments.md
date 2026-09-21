---
id: APP-06
title: Debts and scheduled payments
epic: appearance
status: done
size: M
depends_on: [APP-01, CMT-12]
spec: ["§28"]
---

## Story

As a **household member**, I want **the commitments that end shown as cards with their progress** so that **I can see what is nearly paid off without opening anything**.

## Acceptance criteria

- [x] A section headed "Debts and scheduled payments", with a note that these end rather than repeat
- [x] A debt card: remaining of initial, a progress bar, percent repaid, monthly payment and months left
- [ ] A debt card offers "Record actual balance" in place
- [x] A tax card: next amount, due date, a CONFIRMED or ESTIMATED badge, and what remains scheduled
- [ ] A tax card offers "See schedule"
- [x] Estimated amounts carry ~ and never render with a confirmed amount's authority

## Notes

**Both actions are links to the Commitments screen, not controls in place**, so
their two criteria stay unticked. Recording a balance from here needs the
mutation, the dialog and the refresh of every atom the new figure changes;
"See schedule" needs a per-commitment route that does not exist. Both are
worth doing and neither is a layout change, which is what this epic is.

The panel had **no tests at all** before this — TRJ-06 shipped it untested.
There are ten now, and they caught a real fault in the first version: the card
was headed "Next tax payment" from fixed copy, so a household with two tax
liabilities got two identically titled cards. The heading is the liability's
own name.

Replaces `CommitmentsAheadPanel`, which lists the same commitments as plain
rows. Everything the cards show is already computed — `DebtPosition` carries
remaining, percent and months left; the tax schedule carries dated rows with
their own basis (CMT-06, CMT-07).

"Record actual balance" and "See schedule" both exist on the Commitments detail
panel. Here they are entry points to the same thing, not new behaviour.
