---
id: TRJ-07
title: Projection chart
epic: trajectory
status: todo
size: M
depends_on: [TRJ-04, SHL-02]
spec: ["§33", "§38"]
---

## Story

As a **household member**, I want **to see our savings trajectory against the goal** so that **I understand the shape of the plan, not just its end date**.

## Acceptance criteria

- [ ] Time on X, household savings on Y
- [ ] Recorded actuals solid; forecast visually distinct beyond today
- [ ] A goal line, and the forecast's intersection with it clearly marked
- [ ] Accumulation is linear between events — no smooth exponential curve, since no investment return is modelled
- [ ] No area fill beneath the forecast line
- [ ] Gridlines faint; the same tick interval on every instance of the chart
- [ ] Legible in greyscale

## Notes

The curve's shape is a correctness issue. A convex curve tells the user their money compounds. It doesn't — bends come only from debt payoff and tax events.
