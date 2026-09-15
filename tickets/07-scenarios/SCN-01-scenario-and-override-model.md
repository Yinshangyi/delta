---
id: SCN-01
title: Scenario and override model
epic: scenarios
status: todo
size: M
depends_on: [FND-01]
spec: ["§35", "§75"]
---

## Story

As a **developer**, I want **scenarios modelled as overrides rather than copies** so that **a scenario recomputes against live data instead of freezing a stale answer**.

## Acceptance criteria

- [ ] A scenario holds a name and an ordered list of overrides
- [ ] Overrides: change daily rate, change billable days, add expense, disable commitment, change income, exclude holding, change holding value
- [ ] A scenario never stores a computed result
- [ ] Overrides reference entities by id
- [ ] Closed tagged union — an unhandled override type is a type error
