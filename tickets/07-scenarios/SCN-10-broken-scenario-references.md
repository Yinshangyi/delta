---
id: SCN-10
title: Broken scenario references
epic: scenarios
status: todo
size: S
depends_on: [SCN-02]
spec: ["§35"]
---

## Story

As a **household member**, I want **to be told when a scenario refers to something deleted** so that **a stale scenario never silently changes its own answer**.

## Acceptance criteria

- [ ] An override pointing at a deleted entity marks the scenario broken
- [ ] The broken override is identified specifically
- [ ] A broken override is never silently dropped — that would alter the result unannounced
- [ ] Repair by removing the override or pointing it elsewhere
- [ ] A broken scenario shows no delta until repaired
