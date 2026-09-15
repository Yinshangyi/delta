---
id: SHL-03
title: Presentation vocabulary
epic: shell
status: todo
size: M
depends_on: [FND-02, FND-03]
spec: []
---

## Story

As a **developer**, I want **formatting as pure functions outside components** so that **currency and date rendering is testable and consistent**.

## Acceptance criteria

- [ ] Money, month, exact date and signed delta formatters, all pure
- [ ] Estimates render with a `~` prefix and carry a label — the tilde alone is never the only signal
- [ ] Deltas are always signed and directional: `3 months sooner`, `€1,500 behind plan`
- [ ] No formatting logic inside JSX
- [ ] Locale is a single decision made in one place
