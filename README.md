<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="imgs/delta-lockup-cream.png">
    <img src="imgs/delta-lockup-ink.png" alt="Delta — when do we get there?" width="520">
  </picture>
</p>

A private, local-first household financial projection app. It answers one question:

> Given our current situation and trajectory, **when do we get there?**

Your data is entered by hand and stays on your machine. There is no account, no
server, no sync — SQLite runs in the browser, and the database is a file in
origin-private storage that nothing else can read.

| | |
|---|---|
| [`specification.md`](specification.md) | the product and its domain |
| [`architecture.md`](architecture.md) | structure, layering, module boundaries |
| [`design-brief.md`](design-brief.md) | visual direction and screen inventory |
| [`CLAUDE.md`](CLAUDE.md) | conventions, in the short form an agent needs |
| [`tickets/`](tickets/) | the backlog as markdown stories — [`BOARD.md`](tickets/BOARD.md) |

## Getting set up

The toolchain is a Nix flake, entered automatically by direnv, so nothing is
installed globally. With Nix and direnv already on the machine:

```bash
direnv allow
```

That puts Node and `pnpm` on `PATH` for this directory only — `flake.nix` pins
nixpkgs, `nix/devshell.nix` lists the tools, and `packageManager` in
`package.json` pins the exact pnpm version corepack fetches. Thereafter `cd`
into the directory is enough.

Without direnv, `nix develop` opens the same shell. Without Nix at all, Node 22+
and `corepack pnpm …` will do.

```bash
pnpm install
pnpm exec playwright install chromium   # once, for the browser tests
```

## Running

```bash
pnpm dev        # http://localhost:5173
pnpm build      # type-checks, then emits a static bundle to dist/
pnpm preview    # serve dist/ locally
```

## Checks

```bash
pnpm type-check       # app, tests and build config
pnpm test             # every project
pnpm test:node        # domain and use cases — no browser
pnpm test:browser     # components, headless chromium
pnpm lint             # oxlint
pnpm format           # oxfmt, in place — also owns import order
pnpm lint:boundaries  # dependency-cruiser — the hexagon
pnpm ast-grep         # structural idioms
pnpm ast-grep:test    # the rules themselves — every rule has a test case
```

Two budgets are linted rather than reviewed: 200 lines a file, 40 a function
(400 for a `.tsx`, whose length is mostly markup; off in tests). They are met by
lifting code out, never by raising the number — see `tools/gates/`.

`pnpm type-check` is the real gate. Effect v4 renamed enough that a stale idiom
often fails at *import* time rather than in an assertion, so a green test run
alone proves less than it looks.

All of the above also run per edited file as Claude Code hooks, alongside one
that routes shell commands through `rtk` to trim their output — see
[`tools/hooks/`](tools/hooks/). Three of them exit 2 on a finding, which turns
them from a report into a loop. They need `.direnv/devshell-path`, written on
shell entry, so run `direnv allow` once before relying on them.

They also run as git hooks — the fast ones on commit, all of them on push
([`lefthook.yml`](lefthook.yml), installed on shell entry) — and again in CI,
where they cannot be skipped: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Development data

The database is SQLite over OPFS, inside a browser worker — there is no file on
disk, so there is no `reset-dev-db` command a shell can run. The controls are in
the app instead, under **Settings → Development**, and exist only in a
development build: the whole section is behind `import.meta.env.DEV`, which Vite
resolves away, so a production bundle does not contain them.

| Action | What it does |
|---|---|
| Seed if empty | Fills an empty database with the household from `src/bootstrap/seed/`. Adds nothing if one already exists. |
| Reset to seed data | Empties every table, then seeds. The usual one. |
| Delete the database | Removes the OPFS file, so the next load runs every migration against nothing — the one that would catch a migration bug. |

Every seed figure is fictional and lives in
[`DevelopmentSeedData.ts`](src/bootstrap/seed/DevelopmentSeedData.ts), separate
from the code that inserts it. Tests never read it — `dependency-cruiser`
forbids that, because fixtures you assert against and data you look at are
different things.

## Layout

```
src/
  shared/domain/        Money · Percentage · LocalDate · YearMonth
                        BillableDays · DailyRate · PayoutRatio · errors
  modules/              household · commitments · capital · trajectory · scenarios
  bootstrap/
    persistence/        SQLite over OPFS · migrations · durable storage
    runtime/            AppLayer — the composition root; AppRuntime — the atom bridge
```

Each module is a complete hexagon. `core/` holds domain, ports and use cases and
may not import an adapter, React, or any reactivity primitive;
`primary_adapters/` may not import `secondary_adapters/`; the two sides meet only
at the composition root.

That is not a convention — [`.dependency-cruiser.cjs`](.dependency-cruiser.cjs)
enforces it on every edit and in `pnpm lint:boundaries`, and it carries a diagram
of the rules at the top. `architecture.md` holds the reasoning behind them.

`@/` resolves to `src/` in TypeScript, Vite and Vitest alike.

## Decisions worth knowing before reading the code

**Money is integer cents; percentages are integer basis points.** Not
precision theatre: a projection terminates on `balance >= target`, and there a
sub-microcent shortfall costs a whole month. Saving €0.10 toward €10.00 reaches
the goal at month 101 in floats and month 100 in cents.

**`Date` appears nowhere, and the linter enforces it.** The same instant is 1
March in UTC and 28 February in Los Angeles. `LocalDate` and `YearMonth` are
branded ISO strings over `Temporal`, so a projection gives the same answer on
any machine.

**Expected failures are values, not exceptions.** Tagged errors in a typed
channel; a test fails the build on a `throw` in production code.

**The database is a worker, and it has to be.** SQLite's OPFS VFS needs
synchronous access handles, which exist only off the main thread — so every
query crosses a message boundary, and nothing can read the database during a
render.

**Effect and every `@effect/*` package are pinned to one exact version** and
move in lockstep. Upgrade them in a dedicated commit, never incidentally.

## A note on hosting

The dev server sends `Cross-Origin-Opener-Policy` and
`Cross-Origin-Embedder-Policy`. SQLite over OPFS wants a cross-origin isolated
context, so whatever serves the production bundle has to send the same two
headers.
