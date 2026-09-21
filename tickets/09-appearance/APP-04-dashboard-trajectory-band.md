---
id: APP-04
title: Dashboard trajectory band
epic: appearance
status: todo
size: S
depends_on: [APP-03]
spec: ["§17"]
---

## Story

As a **household member**, I want **income, commitments and expected savings as three figures under the headline** so that **I can see what drives the date without scrolling**.

## Acceptance criteria

- [ ] Three columns, divided by rules, directly beneath the header card
- [ ] Household income, with a per-person breakdown line
- [ ] Commitments, with a count and a note that tax is scheduled separately
- [ ] Expected monthly savings, with "income less commitments" as its note
- [ ] Freelance figures carry ~ and salaried figures do not
- [ ] The three read as context, not as the point — smaller than the headline, larger than body

## Notes

These three numbers exist today in "Where the money goes", below the chart. The
data is right; the placement is what the mock disagrees with, and the brief's
hierarchy (b, directly after the headline) agrees with the mock.

The per-person line is new: `HouseholdOverviewQuery` has the sources, but the
dashboard has never asked for them.
