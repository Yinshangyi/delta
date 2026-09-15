---
id: TRJ-03
title: Cash flow sources
epic: trajectory
status: todo
size: S
depends_on: [HH-11, CMT-13]
spec: ["§29"]
---

## Story

As a **developer**, I want **one port supplying every cash flow to the projection** so that **trajectory never imports its sibling modules**.

## Acceptance criteria

- [ ] `between(from, to)` merges the household and commitment queries
- [ ] The live implementation is the only place those two are combined
- [ ] Trajectory depends on this port alone, not on household or commitments directly
- [ ] Substituting a stub changes the projection with no other code touched
