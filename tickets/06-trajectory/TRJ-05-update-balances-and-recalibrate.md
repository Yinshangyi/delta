---
id: TRJ-05
title: Update balances and recalibrate
epic: trajectory
status: todo
size: L
depends_on: [TRJ-04, CAP-04, CAP-06]
spec: ["§16", "§74", "§2.3"]
---

## Story

As a **household member**, I want **to record current balances and immediately see what changed** so that **this is the whole monthly routine**.

## Acceptance criteria

- [ ] One form updates several holdings in a single pass
- [ ] Blank means unchanged, not zero, and that is unmistakable
- [ ] Prior values shown beside each field
- [ ] After saving, the expected and actual figures are compared: €29,500 expected against €28,000 actual reads as €1,500 behind plan
- [ ] The moved target date is stated explicitly: October 2028 → November 2028
- [ ] Future projections restart from the recorded values
- [ ] No transaction entry is required at any point

## Notes

`size: L` — split into the multi-holding form, the comparison calculation, and the result presentation. This is the product's core loop (§62); it deserves the most care of anything in this epic.
