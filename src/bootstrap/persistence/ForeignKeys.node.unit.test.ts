import { Effect, Layer, Result } from "effect"
import { SqlClient } from "effect/unstable/sql"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"

const Migrated = MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))

const run = <A, E>(effect: Effect.Effect<A, E, SqlClient.SqlClient>): Promise<A> =>
  Effect.runPromise(Effect.scoped(Effect.provide(effect, Migrated)))

/**
 * SQLite's foreign keys are off by default and on per connection, so every
 * `REFERENCES … ON DELETE CASCADE` in the migrations is decorative without the
 * pragma — and a schema that does not enforce anything looks exactly like one
 * that does. These are the tests that tell the two apart.
 */
describe("referential integrity", () => {
  it("is switched on for the connection", async () => {
    const rows = await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        return yield* sql<{ foreign_keys: number }>`PRAGMA foreign_keys`
      })
    )

    expect(rows[0]?.foreign_keys).toBe(1)
  })

  it("refuses a person in a household that does not exist", async () => {
    const outcome = await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        return yield* Effect.result(
          sql`INSERT INTO people (id, household_id, name) VALUES ('p1', 'nobody', 'Ada')`
        )
      })
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("takes a person's income with them when they are removed", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`INSERT INTO households (id, name) VALUES ('h1', 'Home')`
        yield* sql`INSERT INTO people (id, household_id, name) VALUES ('p1', 'h1', 'Ada')`
        yield* sql`
          INSERT INTO income_sources (id, person_id, kind, name, start_date, enabled)
          VALUES ('i1', 'p1', 'salary', 'Employment', '2026-01-01', 1)
        `
        yield* sql`DELETE FROM people WHERE id = 'p1'`
        return yield* sql<{ id: string }>`SELECT id FROM income_sources`
      })
    )

    expect(remaining).toStrictEqual([])
  })

  it("takes a debt's recorded balances with it when it is removed", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`INSERT INTO households (id, name) VALUES ('h1', 'Home')`
        yield* sql`
          INSERT INTO commitments (id, household_id, kind, name, enabled)
          VALUES ('d1', 'h1', 'Debt', 'Card debt', 1)
        `
        yield* sql`
          INSERT INTO debt_snapshots (id, debt_id, date, remaining_amount_cents)
          VALUES ('s1', 'd1', '2026-12-31', 720000)
        `
        yield* sql`DELETE FROM commitments WHERE id = 'd1'`
        return yield* sql<{ id: string }>`SELECT id FROM debt_snapshots`
      })
    )

    expect(remaining).toStrictEqual([])
  })
})
