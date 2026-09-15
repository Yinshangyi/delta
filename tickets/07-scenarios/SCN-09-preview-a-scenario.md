---
id: SCN-09
title: Preview a scenario
epic: scenarios
status: todo
size: S
depends_on: [SCN-06]
spec: ["§34"]
---

## Story

As a **household member**, I want **to view my dashboard under a scenario without applying it** so that **I can sit with a possibility before committing**.

## Acceptance criteria

- [ ] The whole app renders under the scenario, persistently and obviously marked
- [ ] Exiting preview is always available and returns to the real plan untouched
- [ ] No write reaches real configuration while previewing
- [ ] Preview state does not survive a reload
