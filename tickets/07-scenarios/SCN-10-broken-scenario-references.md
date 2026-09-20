---
id: SCN-10
title: Broken scenario references
epic: scenarios
status: done
size: S
depends_on: [SCN-02]
spec: ["§35"]
---

## Story

As a **household member**, I want **to be told when a scenario refers to something deleted** so that **a stale scenario never silently changes its own answer**.

## Acceptance criteria

- [x] An override pointing at a deleted entity marks the scenario broken
- [x] The broken override is identified specifically
- [x] A broken override is never silently dropped — that would alter the result unannounced
- [x] Repair by removing the override or pointing it elsewhere
- [x] A broken scenario shows no delta until repaired

## Notes

Repair is by removing the override in the builder, which is what "point it
elsewhere" amounts to: add the replacement, remove the broken one. There is no
separate repair dialog.
