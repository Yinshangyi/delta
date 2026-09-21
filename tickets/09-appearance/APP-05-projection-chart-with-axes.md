---
id: APP-05
title: Projection chart with axes and legend
epic: appearance
status: done
size: M
depends_on: [APP-01, TRJ-07]
spec: ["§33"]
---

## Story

As a **household member**, I want **the chart to carry its own scale** so that **I can read a value off it instead of only its shape**.

## Acceptance criteria

- [x] A Y axis with labelled gridlines at round amounts
- [x] An X axis with labelled month ticks at a fixed interval
- [x] A legend naming actual, forecast and the goal line
- [x] A vertical rule at today, labelled
- [x] The forecast's meeting with the goal is marked, labelled with the month, and dropped to the axis
- [x] Forecast is blue and dashed; actual is black and solid; the goal line is dotted
- [x] Every label names a value the chart actually reaches

## Notes

**This overturns one of TRJ-07's criteria, deliberately.** TRJ-07 asked for a
fixed tick *count* so two charts compare; a round step over an arbitrary range
gives four ticks or six, not always five. Round labels won — €63.8k · €94.3k ·
€124.8k is an arithmetically correct axis nobody can read. The count is held
near `TICK_COUNT` so the chart still looks the same from one household to the
next, and the test says so in those words.

**The vertical scale now always includes nought.** It previously ran from the
curve's own minimum, which exaggerates every slope: the first pixel of height
was already tens of thousands of euros. This is the one change here that alters
what the chart claims rather than what it labels.

The geometry moved to `TrajectoryAxes.ts` — `TrajectoryCurve.ts` went over its
200-line budget, and the split is along the seam that was already there: the
curve is the data, the axes are how it is measured.

`TrajectoryCurve` already computes ticks and plot geometry as pure functions,
and `ticks()` is already used for the gridlines — they are drawn without labels
today. This is mostly labelling what is already positioned.

Colour is additional here, never load-bearing: the three lines stay apart by
dash pattern alone, which is what keeps principle 5 true.
