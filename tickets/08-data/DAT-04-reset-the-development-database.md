---
id: DAT-04
title: Reset the development database
epic: data
status: todo
size: S
depends_on: [DAT-03]
spec: ["§51"]
---

## Story

As a **developer**, I want **to wipe, migrate and reseed in one step** so that **I can get back to a known state quickly**.

## Acceptance criteria

- [ ] One command drops, migrates and seeds
- [ ] Unavailable in a production build
- [ ] Test fixtures are deterministic and separate from the development seed
- [ ] Documented in the README
