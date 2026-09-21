---
id: APP-04
title: Dashboard trajectory band
epic: appearance
status: done
size: S
depends_on: [APP-03]
spec: ["§17"]
---

## Story

As a **household member**, I want **income, commitments and expected savings as three figures under the headline** so that **I can see what drives the date without scrolling**.

## Acceptance criteria

- [x] Three columns, divided by rules, directly beneath the header card
- [ ] Household income, with a per-person breakdown line
- [x] Commitments, with a count and a note that tax is scheduled separately
- [x] Expected monthly savings, with "income less commitments" as its note
- [ ] Freelance figures carry ~ and salaried figures do not
- [x] The three read as context, not as the point — smaller than the headline, larger than body

## Notes

**The per-person line is not built, and the ~ criterion goes with it.** Both
need a per-person monthly income, and that arithmetic lives in `household`'s
cash-flow translation — freelance is a daily rate times billable days times a
payout ratio, not a stored figure. Reaching it from the dashboard means a new
query in `household/core`, and this epic's README says it changes no domain
code. It is a small ticket, not a layout change, and it should be one.

What the third column does carry instead of the mock's note is the lumpy-month
average, which TRJ-06 insisted on: a single "left over" figure either hides an
annual tax bill or spreads it invisibly. The mock has no equivalent, and
dropping it to match would cost information.

These three numbers exist today in "Where the money goes", below the chart. The
data is right; the placement is what the mock disagrees with, and the brief's
hierarchy (b, directly after the headline) agrees with the mock.

The per-person line is new: `HouseholdOverviewQuery` has the sources, but the
dashboard has never asked for them.
