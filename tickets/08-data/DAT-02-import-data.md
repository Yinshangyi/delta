---
id: DAT-02
title: Import data
epic: data
status: todo
size: M
depends_on: [DAT-01]
spec: ["§2.2"]
---

## Story

As a **household member**, I want **to restore from a backup file** so that **I can recover, or move to another machine**.

## Acceptance criteria

- [ ] Restoring states plainly that it replaces everything currently held
- [ ] A summary of what will change is shown before anything is written
- [ ] Import is atomic — a malformed file leaves existing data untouched
- [ ] A version mismatch is reported clearly rather than half-applied
- [ ] After import the projection recalculates from the restored data
