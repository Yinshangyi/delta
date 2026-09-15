import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { StorageDurability } from "@/bootstrap/persistence/StorageDurability"
import { makeStorageDurabilityStub } from "@/bootstrap/persistence/StorageDurabilityStub"
import { makeAppLayer } from "@/bootstrap/runtime/AppLayer"

/**
 * The composition root is only worth having if a test can replace a driven
 * adapter without touching anything else. These tests build the *real*
 * composition — migrations, startup effects and all — over swapped adapters.
 */
describe("the composition root", () => {
  it("builds over an in-memory database with the schema applied", async () => {
    const stub = makeStorageDurabilityStub({})
    const tables = await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient
          const rows = yield* sql<{ name: string }>`
            SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
          `
          return rows.map((row) => row.name)
        }).pipe(Effect.provide(makeAppLayer(DatabaseInMemory, stub.layer)))
      )
    )

    expect(tables).toContain("app_metadata")
    expect(tables).toContain("effect_sql_migrations")
  })

  it("runs the durability request once while building, not when a screen asks", async () => {
    const stub = makeStorageDurabilityStub({ granted: true })

    await Effect.runPromise(
      Effect.scoped(Effect.provide(Effect.void, makeAppLayer(DatabaseInMemory, stub.layer)))
    )

    expect(stub.inspect().requests).toBe(1)
  })

  it("accepts a different durability adapter with no change to the composition", async () => {
    const refusing = makeStorageDurabilityStub({ granted: false })

    const persisted = await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const durability = yield* StorageDurability
          return yield* durability.isPersisted
        }).pipe(Effect.provide(makeAppLayer(DatabaseInMemory, refusing.layer)))
      )
    )

    expect(persisted).toBe(false)
  })

  it("provides both services from one layer", async () => {
    const stub = makeStorageDurabilityStub({})
    const both = await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient
          const durability = yield* StorageDurability
          return { sql: typeof sql, durability: typeof durability }
        }).pipe(Effect.provide(makeAppLayer(DatabaseInMemory, stub.layer)))
      )
    )

    expect(both).toStrictEqual({ sql: "function", durability: "object" })
  })
})
