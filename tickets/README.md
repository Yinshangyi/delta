# Tickets

One markdown file per user story. No Jira, no board tool.

## Layout

```
tickets/
  01-foundations/   project setup, shared domain, persistence
  02-shell/         navigation, layout, theming, design system
  03-household/     people, income sources
  04-commitments/   expenses, debt, tax
  05-capital/       bank accounts, physical assets, valuations
  06-trajectory/    goals, projection engine, dashboard, chart
  07-scenarios/     overrides, builder, comparison
  08-data/          export, import, seed
```

Folders are numbered in rough dependency order. A ticket's file never moves —
status lives in frontmatter, so paths stay stable, links keep working, and git
shows an edit rather than a delete plus an add.

## Frontmatter

```yaml
id: CAP-03            # epic prefix + local number, stable forever
title: Add a bank account
epic: capital
status: todo          # todo | doing | done | blocked
size: S               # S (<half day) | M (~a day) | L (needs splitting)
depends_on: [FND-02]  # ticket ids
spec: ["§69", "§72"]  # sections of specification.md this implements
```

`spec:` is the one field worth the discipline. Every ticket traces to the
specification, so a change to §71 tells you exactly which tickets to revisit.

An `L` is a signal, not an estimate — split it.

## Workflow

1. Pick a ticket whose `depends_on` are all `done`
2. Set `status: doing` — one at a time
3. Write the test first, then the code
4. Tick the acceptance criteria as they pass
5. Set `status: done`, commit with the ticket id in the message

## Board

`BOARD.md` is generated. Never edit it by hand.

```bash
python3 tickets/board.py
```
