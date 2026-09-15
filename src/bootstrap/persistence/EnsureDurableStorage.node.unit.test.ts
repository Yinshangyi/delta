import { Effect, Layer } from "effect"
import { SqlClient } from "effect/unstable/sql"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { ensureDurableStorage } from "@/bootstrap/persistence/EnsureDurableStorage"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { type StorageDurability } from "@/bootstrap/persistence/StorageDurability"
import {
  makeStorageDurabilityStub,
  type StorageDurabilityStubOptions
} from "@/bootstrap/persistence/StorageDurabilityStub"

const MigratedDatabase = MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))

type Wiring = StorageDurability | SqlClient.SqlClient

/**
 * One database, one stub, several runs — the point is what happens on the
 * second visit, so both have to survive between them.
 */
const withDatabase = async <A>(
  options: StorageDurabilityStubOptions,
  use: (
    run: <B>(effect: Effect.Effect<B, never, Wiring>) => Promise<B>,
    inspect: () => { requests: number }
  ) => Promise<A>
): Promise<A> => {
  const stub = makeStorageDurabilityStub(options)
  return Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const context = yield* Effect.context<Wiring>()
        const run = <B>(effect: Effect.Effect<B, never, Wiring>): Promise<B> =>
          Effect.runPromise(Effect.provide(effect, context))
        return yield* Effect.promise(() => use(run, stub.inspect))
      }).pipe(Effect.provide(Layer.mergeAll(MigratedDatabase, stub.layer)))
    )
  )
}

describe("first run", () => {
  it("asks the browser to keep the data", async () => {
    const outcome = await withDatabase({ granted: true }, async (run, inspect) => {
      const status = await run(ensureDurableStorage)
      return { status, ...inspect() }
    })

    expect(outcome.requests).toBe(1)
    expect(outcome.status.persisted).toBe(true)
    expect(outcome.status.askedBefore).toBe(false)
  })

  it("reports usage so Settings can show it", async () => {
    const status = await withDatabase(
      { estimate: { usedBytes: 4_096, quotaBytes: 2_000_000 } },
      (run) => run(ensureDurableStorage)
    )
    expect(status.estimate).toStrictEqual({ usedBytes: 4_096, quotaBytes: 2_000_000 })
  })
})

describe("a refusal", () => {
  it("is reported rather than thrown", async () => {
    const status = await withDatabase({ granted: false }, (run) => run(ensureDurableStorage))
    expect(status.persisted).toBe(false)
  })

  it("is not re-asked on the next run", async () => {
    const outcome = await withDatabase({ granted: false }, async (run, inspect) => {
      await run(ensureDurableStorage)
      const second = await run(ensureDurableStorage)
      return { second, ...inspect() }
    })

    expect(outcome.requests).toBe(1)
    expect(outcome.second.askedBefore).toBe(true)
    expect(outcome.second.persisted).toBe(false)
  })
})

describe("an origin the browser already persists", () => {
  it("is never asked at all", async () => {
    const outcome = await withDatabase({ alreadyPersisted: true }, async (run, inspect) => {
      const status = await run(ensureDurableStorage)
      return { status, ...inspect() }
    })

    expect(outcome.requests).toBe(0)
    expect(outcome.status.persisted).toBe(true)
  })
})
