---
id: FND-06
title: Migration runner
epic: foundations
status: done
size: M
depends_on: [FND-05]
spec: ["§51"]
---

## Story

As a **developer**, I want **versioned schema migrations applied at startup** so that **the schema can evolve without losing anyone's data**.

## Acceptance criteria

- [x] Migrations run in order at boot and are idempotent
- [x] An already-migrated database is left untouched
- [x] A failing migration aborts startup with a typed error rather than a half-applied schema
- [x] Migrations live in `bootstrap/persistence/migrations/`, one file per version
- [x] Tests run the full migration chain against an in-memory database

## Notes

Schema is global, so migrations are not per-module even though repositories are.
