---
id: TRJ-11
title: Projection screen
epic: trajectory
status: done
size: S
depends_on: [TRJ-07, TRJ-08, SHL-01]
spec: ["§31", "§33"]
---

## Story

As a **household member**, I want **a section that is only the projection** so that **I can read the whole path to the goal without the dashboard's summary competing for the space**.

## Acceptance criteria

- [x] The Projection section shows the savings chart and the month-by-month table
- [x] The chart is drawn taller here than in the dashboard's panel, from the same geometry
- [x] The table appears on this screen only — the dashboard does not repeat it
- [x] The dashboard points here, from the chart the rows belong to
- [x] A previewed scenario renders on this screen, marked hypothetical
- [ ] With no goal set, the screen says so rather than drawing an empty chart

## Notes

**Written after the fact.** The change shipped in `d1e6b86` before this ticket
existed, so the criteria above were read back off working code rather than
driving it. That is the wrong direction and the reason it is recorded here: the
section had been in the nav since SHL-01 routing to a placeholder, and nothing
on the board said so.

The last criterion is unticked because it is unverified, not because it is
missing. `ProjectionContainer` branches to an empty state when the goal is
`None`, copying the dashboard's equivalent branch, but no test covers it and I
did not reach it in the running app — the container reads atoms, and
CLAUDE.md rules out mounting those to test it. It wants either a goal-less seed
path or the branch lifted into the leaf, where a test can reach it.

Everything else was checked against the seed household in the browser, and the
first three are covered by `ProjectionScreen.browser.unit.test.tsx`.

The chart takes a `size` rather than gaining a second implementation — the same
`TrajectoryCurve` geometry in a taller box, so the forecast's slope reads
instead of flattening into the horizontal.

This also advances SCN-09's unticked criterion, which asks that the whole app
render under a scenario: Projection reads the same `projectionAtom` as the
dashboard, so a preview reaches it with no second projection that could
disagree. Capital and Commitments still stay on real configuration, for the
reason recorded there — they are editing surfaces.
