---
id: APP-07
title: Capital screen layout
epic: appearance
status: todo
size: M
depends_on: [APP-01, CAP-08]
spec: ["§70", "§74"]
---

## Story

As a **household member**, I want **the Capital screen grouped and labelled as the mock has it** so that **an account and a watch never read as the same kind of number**.

## Acceptance criteria

- [ ] Two cards at the top: total capital, and the estimated target marked LIVE
- [ ] The target card carries a pill saying whether the set differs from the default
- [ ] ACCOUNTS and ASSETS as labelled groups, each with an INCLUDED column header
- [ ] The accounts group is captioned "balances you can verify"
- [ ] The assets group is captioned as estimated resale, never the authority of a balance
- [ ] An excluded row stays in place, struck through and muted, with its toggle off
- [ ] A stale valuation carries a STALE badge with its age in months
- [ ] A total row closes the list, stating how many holdings are excluded
- [ ] A closing paragraph explains the conventions on the screen

## Notes

The behaviour is all CAP-07 and CAP-08 and already works — toggling recomputes
the total and the target date in place. This ticket is the composition: the
group captions, the column header, the stale badge and the closing note, none of
which exist today.

"unchanged from your default set" needs a comparison the screen does not
currently make: the included set against every holding.
