---
id: FND-15
title: CI pipeline
epic: foundations
status: done
size: S
depends_on: [FND-08, FND-12]
spec: []
---

## Story

As a **developer**, I want **every push checked automatically** so that **the guards are real rather than advisory**.

## Acceptance criteria

- [x] Type-check, lint, boundary guard, ast-grep and both test projects all run
- [ ] A failure blocks the merge
- [x] The build artefact is produced and its size reported
- [x] Runs in under five minutes

## Notes

FND-07 and FND-08 both already claim their checks run in CI. This is the ticket that makes that true.

Branch protection and rulesets are a paid feature on a private repository — the
API answers "Upgrade to GitHub Pro or make this repository public". CI reports
red and the PR shows it, but nothing prevents a merge until the repo is on Pro
or public. Verified on 2026-09-15 that a boundary violation fails the run.
