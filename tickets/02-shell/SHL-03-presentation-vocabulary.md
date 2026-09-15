---
id: SHL-03
title: Presentation vocabulary
epic: shell
status: done
size: M
depends_on: [FND-02, FND-03]
spec: []
---

## Story

As a **developer**, I want **formatting as pure functions outside components** so that **currency and date rendering is testable and consistent**.

## Acceptance criteria

- [x] Money, month, exact date and signed delta formatters, all pure
- [x] Estimates render with a `~` prefix and carry a label — the tilde alone is never the only signal
- [x] Deltas are always signed and directional: `3 months sooner`, `€1,500 behind plan`
- [x] No formatting logic inside JSX
- [x] Locale is a single decision made in one place
