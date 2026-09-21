---
id: APP-05
title: Projection chart with axes and legend
epic: appearance
status: todo
size: M
depends_on: [APP-01, TRJ-07]
spec: ["§33"]
---

## Story

As a **household member**, I want **the chart to carry its own scale** so that **I can read a value off it instead of only its shape**.

## Acceptance criteria

- [ ] A Y axis with labelled gridlines at round amounts
- [ ] An X axis with labelled month ticks at a fixed interval
- [ ] A legend naming actual, forecast and the goal line
- [ ] A vertical rule at today, labelled
- [ ] The forecast's meeting with the goal is marked, labelled with the month, and dropped to the axis
- [ ] Forecast is blue and dashed; actual is black and solid; the goal line is dotted
- [ ] Every label names a value the chart actually reaches

## Notes

`TrajectoryCurve` already computes ticks and plot geometry as pure functions,
and `ticks()` is already used for the gridlines — they are drawn without labels
today. This is mostly labelling what is already positioned.

Colour is additional here, never load-bearing: the three lines stay apart by
dash pattern alone, which is what keeps principle 5 true.
