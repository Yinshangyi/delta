---
id: TRJ-07
title: Projection chart
epic: trajectory
status: done
size: M
depends_on: [TRJ-04, SHL-02]
spec: ["§33", "§38"]
---

## Story

As a **household member**, I want **to see our savings trajectory against the goal** so that **I understand the shape of the plan, not just its end date**.

## Acceptance criteria

- [x] Time on X, household savings on Y
- [x] Recorded actuals solid; forecast visually distinct beyond today
- [x] A goal line, and the forecast's intersection with it clearly marked
- [x] Accumulation is linear between events — no smooth exponential curve, since no investment return is modelled
- [x] No area fill beneath the forecast line
- [x] Gridlines faint; the same tick interval on every instance of the chart
- [x] Legible in greyscale

## Notes

The curve's shape is a correctness issue. A convex curve tells the user their money compounds. It doesn't — bends come only from debt payoff and tax events.

## Notes

Drawn from `TrajectoryCurve`'s geometry as inline SVG rather than with
Recharts. Every criterion here is about restraint — straight segments, no area
fill, faint gridlines, one tick interval everywhere, greyscale-legible — and
each would have been an argument with a library's defaults. The geometry is
unit-tested in node; the component only turns numbers into markup.
architecture.md's stack row records the change.

The solid segment is the balances the household recorded, not a back-projection
of the engine: reconstructing the past from today's configuration and drawing
it solid would present a reconstruction as a record.
