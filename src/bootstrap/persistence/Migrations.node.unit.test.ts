import { layer } from "@effect/vitest"
import { Effect, Layer, Result } from "effect"
import { SqlClient } from "effect/unstable/sql"
import { describe, expect, it as plainIt } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"

const MigratedDatabase = MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))

/** The migrator's own bookkeeping table. */
const applied = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  return yield* sql<{
    migration_id: number
    name: string
  }>`SELECT migration_id, name FROM effect_sql_migrations ORDER BY migration_id`
})

const countMetadata = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  return yield* sql<{ count: number }>`SELECT COUNT(*) AS count FROM app_metadata`
})

layer(MigratedDatabase)("the migration chain", (it) => {
  it.effect("applies every migration, in id order and without gaps", () =>
    Effect.gen(function* () {
      const ids = (yield* applied).map((row) => row.migration_id)
      // Contiguous from 1 rather than a hard-coded count: a new migration
      // should extend this, not break it.
      expect(ids).toStrictEqual(ids.map((_, index) => index + 1))
      expect(ids.length).toBeGreaterThan(0)
    })
  )

  it.effect("names the first migration, which every later one builds on", () =>
    Effect.gen(function* () {
      expect((yield* applied)[0]?.name).toBe("app_metadata")
    })
  )

  it.effect("creates the schema the migrations describe", () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const rows = yield* sql<{ name: string }>`
        SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
      `
      expect(rows.map((row) => row.name)).toContain("app_metadata")
    })
  )

  it.effect("records what the database is, so an import can refuse a foreign file", () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const rows = yield* sql<{ value: string }>`
        SELECT value FROM app_metadata WHERE key = 'application'
      `
      expect(rows[0]?.value).toBe("delta")
    })
  )

  it.effect("enforces constraints, so tests fail the way production would", () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const outcome = yield* Effect.result(
        sql`INSERT INTO app_metadata (key, value) VALUES ('application', 'other')`
      )
      expect(Result.isFailure(outcome)).toBe(true)
    })
  )
})

layer(MigrationsLive.pipe(Layer.provideMerge(MigratedDatabase)))(
  "an already-migrated database",
  (it) => {
    it.effect("is left untouched by a second migrator", () =>
      Effect.gen(function* () {
        const ids = (yield* applied).map((row) => row.migration_id)
        expect(new Set(ids).size).toBe(ids.length)
      })
    )
  }
)

describe("each build of the in-memory layer", () => {
  const build = <A, E>(effect: Effect.Effect<A, E, SqlClient.SqlClient>): Promise<A> =>
    Effect.runPromise(Effect.scoped(Effect.provide(effect, MigratedDatabase)))

  plainIt("starts from an empty database", async () => {
    const seed = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`INSERT INTO app_metadata (key, value) VALUES ('seen', 'yes')`
      return yield* countMetadata
    })

    expect((await build(seed))[0]?.count).toBe(2)
    expect((await build(countMetadata))[0]?.count).toBe(1)
  })
})
