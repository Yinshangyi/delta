---
id: DAT-02
title: Import data
epic: data
status: done
size: M
depends_on: [DAT-01]
spec: ["§2.2"]
---

## Story

As a **household member**, I want **to restore from a backup file** so that **I can recover, or move to another machine**.

## Acceptance criteria

- [x] Restoring states plainly that it replaces everything currently held
- [x] A summary of what will change is shown before anything is written
- [x] Import is atomic — a malformed file leaves existing data untouched
- [x] A version mismatch is reported clearly rather than half-applied
- [x] After import the projection recalculates from the restored data

## Notes

The restore runs in one transaction, so a file that fails half way through
leaves the data exactly as it was. Two tests prove it: a nonsense file, and a
well-formed file carrying a row the foreign keys refuse.

Rows are not validated against domain rules on the way in, deliberately. A
backup's job is to survive: checking each column against today's rules would
mean a file written last year stops importing because a rule tightened. The
strictness is at the envelope — is this Delta's file, and is it a version this
build reads.
