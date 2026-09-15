---
id: FND-11
title: Request persistent storage
epic: foundations
status: done
size: S
depends_on: [FND-05]
spec: []
---

## Story

As a **household member**, I want **the browser to treat my financial data as durable** so that **months of hand-entered records are not silently evicted**.

## Acceptance criteria

- [x] `navigator.storage.persist()` requested once at first run
- [x] Current persistence state and usage are readable and shown in Settings
- [x] If persistence is denied, the user is told plainly and pointed at export
- [x] Failure never blocks the app from starting

## Notes

This plus export is the whole OPFS durability mitigation. Neither is optional.
