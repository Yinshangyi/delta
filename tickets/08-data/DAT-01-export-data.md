---
id: DAT-01
title: Export data
epic: data
status: todo
size: M
depends_on: [FND-05]
spec: ["§2.2"]
---

## Story

As a **household member**, I want **to save a complete backup to a file** so that **browser storage is not a safe place for the only copy**.

## Acceptance criteria

- [ ] One file containing every holding, valuation, person, income source, commitment, goal and scenario
- [ ] Export is a visible action in Settings, not a buried link
- [ ] The date of the last export is shown
- [ ] The file is inspectable by a human
- [ ] Nothing is transmitted anywhere — the file is written locally

## Notes

Decide deliberately between the SQLite client's native binary export and a JSON document. JSON is readable, diffable and survives schema change; binary is exact. The design brief currently shows JSON.
