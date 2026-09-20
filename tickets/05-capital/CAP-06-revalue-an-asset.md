---
id: CAP-06
title: Revalue an asset
epic: capital
status: done
size: S
depends_on: [CAP-05]
spec: ["§70", "§78"]
---

## Story

As a **household member**, I want **to update what an asset would now fetch** so that **capital reflects current resale value rather than a stale guess**.

## Acceptance criteria

- [x] New estimate plus valuation date, recorded as a snapshot
- [x] The current estimate and its age are shown alongside
- [x] A valuation older than twelve months reads as stale
- [x] Marked an estimate throughout
- [x] Total capital and the target date recalculate on save
