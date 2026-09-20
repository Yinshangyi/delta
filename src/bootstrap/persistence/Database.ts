/**
 * Nothing leaves the machine (spec §2.2).
 *
 * OPFS is browser-only, so this layer cannot be built under node — tests use
 * `DatabaseInMemory`.
 */
import { SqliteClient } from "@effect/sql-sqlite-wasm"
import { Effect, Layer } from "effect"

import { ForeignKeysOn } from "@/bootstrap/persistence/ForeignKeys"

import type { SqlClient, SqlError } from "effect/unstable/sql"

const spawnWorker = Effect.acquireRelease(
  Effect.sync(
    () => new Worker(new URL("./SqliteOpfs.worker.ts", import.meta.url), { type: "module" })
  ),
  (worker) => Effect.sync(() => worker.terminate())
)

export const DatabaseLive: Layer.Layer<
  SqliteClient.SqliteClient | SqlClient.SqlClient,
  SqlError.SqlError
> = ForeignKeysOn.pipe(
  Layer.provideMerge(SqliteClient.layer({ worker: spawnWorker, installReactivityHooks: true }))
)
