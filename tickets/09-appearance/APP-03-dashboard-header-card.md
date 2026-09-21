---
id: APP-03
title: Dashboard header card
epic: appearance
status: todo
size: M
depends_on: [APP-01, TRJ-06]
spec: ["§37", "§74"]
---

## Story

As a **household member**, I want **the target date and total capital side by side at the top** so that **the answer and the number driving it are one glance apart**.

## Acceptance criteria

- [ ] One bordered card, split: estimated target left, total capital right
- [ ] The target date is the largest type on the screen by a wide margin
- [ ] "N months remaining" sits beside a status pill — on plan, ahead, behind
- [ ] The estimate disclaimer is a bordered badge, not body text
- [ ] Total capital shows the figure, the goal, the composition line and a progress bar
- [ ] Two actions in the capital half: "Update balances" primary, "Capital" secondary
- [ ] A header line states when the figures were last updated and that nothing leaves the machine

## Notes

The mock's hierarchy is the brief's principle 1 made literal — the date is
roughly four times the size of the currency beside it. Today both render at
similar weights, which is the single biggest reason the real dashboard reads as
flatter than the mock.

The status pill is `PlanVariance`, which already exists (TRJ-10) and is
currently rendered as a whole panel lower down. The panel stays; the pill is a
second, smaller reading of the same value.
