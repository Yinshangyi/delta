---
id: DAT-01
title: Export data
epic: data
status: done
size: M
depends_on: [FND-05]
spec: ["§2.2"]
---

## Story

As a **household member**, I want **to save a complete backup to a file** so that **browser storage is not a safe place for the only copy**.

## Acceptance criteria

- [x] One file containing every holding, valuation, person, income source, commitment, goal and scenario
- [x] Export is a visible action in Settings, not a buried link
- [x] The date of the last export is shown
- [x] The file is inspectable by a human
- [x] Nothing is transmitted anywhere — the file is written locally

## Notes

Decide deliberately between the SQLite client's native binary export and a JSON document. JSON is readable, diffable and survives schema change; binary is exact. The design brief currently shows JSON.

## Notes

The deliberate decision the ticket asks for: **JSON**, not the wasm client's
binary export. A binary copy is exact but opaque, and a household whose only
copy is a blob they cannot read has to trust that Delta still opens in five
years.

`BACKUP_TABLES` is a list, and a test asserts it equals the tables the database
actually has. A table added in a later migration and forgotten would otherwise
export cleanly, import cleanly, and lose the household's data in silence.
