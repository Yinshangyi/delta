---
id: FND-05
title: SQLite persistence via OPFS
epic: foundations
status: done
size: L
depends_on: [FND-01]
spec: ["§2.2", "§52"]
---

## Story

As a **developer**, I want **a working SQLite database in the browser** so that **financial data persists locally and never leaves the machine**.

## Acceptance criteria

- [x] `SqlClient` provided as an Effect layer backed by the OPFS worker
- [x] The database survives a page reload and a browser restart
- [x] An in-memory client layer is available for tests via `makeMemory`
- [x] No SQL appears outside `secondary_adapters/`
- [x] Works in Chrome, Firefox and Safari

## Notes

`size: L` — split into worker setup, the client layer, and the test layer. Uses `@effect/sql-sqlite-wasm`; the core SQL types live in `effect/unstable/sql`.
