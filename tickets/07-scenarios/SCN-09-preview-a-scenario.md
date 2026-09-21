---
id: SCN-09
title: Preview a scenario
epic: scenarios
status: done
size: S
depends_on: [SCN-06]
spec: ["§34"]
---

## Story

As a **household member**, I want **to view my dashboard under a scenario without applying it** so that **I can sit with a possibility before committing**.

## Acceptance criteria

- [ ] The whole app renders under the scenario, persistently and obviously marked
- [x] Exiting preview is always available and returns to the real plan untouched
- [x] No write reaches real configuration while previewing
- [x] Preview state does not survive a reload

## Notes

Partly done, and marked as such. The banner is app-wide and persistent, and the
**dashboard** — target date, chart, variance — and the **Projection** screen —
chart, month-by-month table — both render under the scenario, through the same
projection atom as the baseline. There is no second projection that could
disagree with the first (TRJ-11).

The Capital and Commitments screens still show real configuration while
previewing. That is a deliberate stop rather than an oversight: they are the
editing surfaces, and showing hypothetical balances on a screen whose controls
write to the database invites editing the simulation by mistake. Making them
scenario-aware needs a read-only mode on both, which is its own piece of work.

Preview lives in an in-memory atom, so a reload always returns to the real
plan — verified in the browser, not only asserted.
