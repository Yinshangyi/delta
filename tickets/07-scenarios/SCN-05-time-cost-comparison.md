---
id: SCN-05
title: Time cost comparison
epic: scenarios
status: todo
size: M
depends_on: [SCN-03, SCN-04, TRJ-04]
spec: ["§36", "§64"]
---

## Story

As a **household member**, I want **the time impact of a change** so that **decisions are expressed in months, not just euros**.

## Acceptance criteria

- [ ] Runs the same projection under the live and overridden layers and diffs the target dates
- [ ] No hard-coded conversion between money and time anywhere
- [ ] Reports direction and magnitude: 3 months sooner, 2 months later
- [ ] Where several overrides are stacked, the net effect is decomposed per change
- [ ] An unreachable baseline or simulation is handled without a spurious number

## Notes

The decomposition — "the holiday costs 1 month; the rate rise buys 4 back" — is the most useful output in the product. Design for it rather than bolting it on.
