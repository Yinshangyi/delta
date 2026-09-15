---
id: SHL-01
title: App layout and navigation
epic: shell
status: todo
size: M
depends_on: [FND-01]
spec: ["§59", "§76"]
---

## Story

As a **household member**, I want **to move between the app's sections** so that **I can reach everything without hunting**.

## Acceptance criteria

- [ ] Six sections: Dashboard, Projection, Capital, Commitments, Scenarios, Settings
- [ ] The current section is visually and programmatically marked
- [ ] Client-side routing; a reload returns to the same section
- [ ] Keyboard navigable with a visible focus state
- [ ] No nav entries for transactions, accounts, taxes, debt or budgets
