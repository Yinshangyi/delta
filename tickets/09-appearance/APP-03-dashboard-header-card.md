---
id: APP-03
title: Dashboard header card
epic: appearance
status: done
size: M
depends_on: [APP-01, TRJ-06]
spec: ["§37", "§74"]
---

## Story

As a **household member**, I want **the target date and total capital side by side at the top** so that **the answer and the number driving it are one glance apart**.

## Acceptance criteria

- [x] One bordered card, split: estimated target left, total capital right
- [x] The target date is the largest type on the screen by a wide margin
- [x] "N months remaining" sits beside a status pill — on plan, ahead, behind
- [x] The estimate disclaimer is a bordered badge, not body text
- [x] Total capital shows the figure, the goal, the composition line and a progress bar
- [x] Two actions in the capital half: "Update balances" primary, "Capital" secondary
- [x] A header line states when the figures were last updated and that nothing leaves the machine

## Notes

**The goal moved onto the progress bar.** It sat after an "of" at `text-sm`
muted, which is smaller than the composition line beneath it and easy to miss —
the figure the whole screen is aimed at, rendered as an annotation. It is now
the bar's right-hand label at `text-base` in ink, with `€0` at the left.

That is where it belongs structurally: the bar's fill is a proportion *of the
goal*, so the goal is the right edge rather than a footnote. An unlabelled bar
states a ratio while hiding both its terms. Naming the ends also gives the bar
the scale it never had, which is the same job the chart's goal line does.

It appears once, not twice — printing €150,000 above the bar and again on it
would put the same figure within a few pixels of itself. There is a test for
that, because the obvious way to make something more visible is to repeat it.

The bar came out as `dsl/ScaleBar`, so the Capital screen's identical bar can
adopt it rather than the two drifting apart.

The mock renders the date as "3 Nov 2026" and Delta renders "03 Nov 2026".
`DateText.day` is `day: "2-digit"` app-wide and dates sit in columns that have
to line up, so the app's format wins over the mock's on this one detail.

Net worth is not in the mock's header at all, but dropping it would lose a
figure spec §77 and CAP-11 exist to state. It sits in the capital half as the
brief's "second, quieter figure", and still disappears on a debt-free household
rather than duplicating capital.

The mock's hierarchy is the brief's principle 1 made literal — the date is
roughly four times the size of the currency beside it. Today both render at
similar weights, which is the single biggest reason the real dashboard reads as
flatter than the mock.

The status pill is `PlanVariance`, which already exists (TRJ-10) and is
currently rendered as a whole panel lower down. The panel stays; the pill is a
second, smaller reading of the same value.
