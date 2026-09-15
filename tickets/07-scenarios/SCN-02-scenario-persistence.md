---
id: SCN-02
title: Scenario persistence
epic: scenarios
status: todo
size: S
depends_on: [SCN-01, FND-06]
spec: ["§35"]
---

## Story

As a **household member**, I want **my saved scenarios to survive a restart** so that **a standing decision can be revisited over months**.

## Acceptance criteria

- [ ] Scenarios and their overrides round-trip without loss
- [ ] Saving is explicit — a simulation is not persisted unless asked for
- [ ] Scenarios are deletable
- [ ] Results are recomputed on read, never stored
