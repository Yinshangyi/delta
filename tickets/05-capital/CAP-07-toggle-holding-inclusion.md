---
id: CAP-07
title: Include or exclude a holding from capital
epic: capital
status: todo
size: M
depends_on: [CAP-03, CAP-05, TRJ-04]
spec: ["§72", "§74"]
---

## Story

As a **household member**, I want **to toggle a holding in or out of total capital** so
that **I can see how far we are without counting things we would not actually sell**.

## Acceptance criteria

- [ ] Every holding carries a persistent `includedInCapital` flag
- [ ] Toggling recomputes total capital and the target date without a page change
- [ ] The target date is visible while toggling — this is the question being asked
- [ ] An excluded holding stays in the list, visibly inert, value muted and struck
- [ ] Excluding never deletes the holding or its valuation history
- [ ] Excluding every holding gives capital of €0 and a `not-reachable` projection,
      presented as a deliberate state rather than an error
- [ ] The flag persists across restarts

## Notes

This is the reason the Capital screen exists — the totals alone would not justify it.
A scenario may override the flag temporarily (§75); the stored value is unaffected.
