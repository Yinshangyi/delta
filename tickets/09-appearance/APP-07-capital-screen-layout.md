---
id: APP-07
title: Capital screen layout
epic: appearance
status: done
size: M
depends_on: [APP-01, CAP-08]
spec: ["§70", "§74"]
---

## Story

As a **household member**, I want **the Capital screen grouped and labelled as the mock has it** so that **an account and a watch never read as the same kind of number**.

## Acceptance criteria

- [x] Two cards at the top: total capital, and the estimated target marked LIVE
- [x] The target card carries a pill saying whether the set differs from the default
- [x] ACCOUNTS and ASSETS as labelled groups, each with an INCLUDED column header
- [x] The accounts group is captioned "balances you can verify"
- [x] The assets group is captioned as estimated resale, never the authority of a balance
- [x] An excluded row stays in place, struck through and muted, with its toggle off
- [x] A stale valuation carries a STALE badge with its age in months
- [x] A total row closes the list, stating how many holdings are excluded
- [x] A closing paragraph explains the conventions on the screen

## Notes

**The mock marks a valuation stale after four months; Delta uses twelve**, and
twelve stayed. `STALE_AFTER_MONTHS` is domain, not layout, and lowering it
changes which holdings a household is told to re-check — a behaviour change
wearing a visual one. The badge now carries the age in months, so a five-month
valuation reads as five months old either way. Worth deciding deliberately.

The stale badge gained that age because "stale" tells a person to look again
and "stale · 14 mo" tells them how badly.

The behaviour is all CAP-07 and CAP-08 and already works — toggling recomputes
the total and the target date in place. This ticket is the composition: the
group captions, the column header, the stale badge and the closing note, none of
which exist today.

"unchanged from your default set" needs a comparison the screen does not
currently make: the included set against every holding.
