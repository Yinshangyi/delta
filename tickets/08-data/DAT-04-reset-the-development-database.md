---
id: DAT-04
title: Reset the development database
epic: data
status: done
size: S
depends_on: [DAT-03]
spec: ["§51"]
---

## Story

As a **developer**, I want **to wipe, migrate and reseed in one step** so that **I can get back to a known state quickly**.

## Acceptance criteria

- [ ] One command drops, migrates and seeds
- [x] Unavailable in a production build
- [x] Test fixtures are deterministic and separate from the development seed
- [x] Documented in the README

## Notes

The first criterion is not met as written, and cannot be. The database is
SQLite over OPFS inside a browser worker — there is no file on disk, so no
shell command can reach it and `pnpm reset-dev-db` would be a lie.

Instead there are two controls under **Settings → Development**, both behind
`import.meta.env.DEV` so a production bundle does not contain them (verified by
grepping a production build, not assumed):

- **Reset to seed data** empties every table and seeds. The usual one.
- **Delete the database** removes the OPFS file, so the next load runs every
  migration against nothing — the one that would catch a migration bug.

Fixture separation is enforced rather than documented: a dependency-cruiser
rule forbids a test importing the seed, with an accepting control for the
seed's own test.
