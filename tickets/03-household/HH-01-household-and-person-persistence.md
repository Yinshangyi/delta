---
id: HH-01
title: Household and person persistence
epic: household
status: todo
size: M
depends_on: [FND-06, FND-10]
spec: ["§5", "§6", "§52"]
---

## Story

As a **developer**, I want **households and people stored and retrieved** so that **the rest of the module has something to build on**.

## Acceptance criteria

- [ ] `HouseholdConfiguration` port with a live SQLite implementation
- [ ] A household holds one or more people; a person belongs to exactly one household
- [ ] Integration tests run against real SQL via the in-memory client
- [ ] A co-located stub exposes `{ layer, inspect }` for other modules' tests

## Notes

Intent-named port, not `HouseholdRepository` — see `architecture.md`.
