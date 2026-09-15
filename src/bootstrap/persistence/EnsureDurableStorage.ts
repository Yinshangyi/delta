/**
 * Asks for persistent storage once, on first run, and remembers the answer in
 * the database so a refusal is not re-asked on every load.
 *
 * Nothing here can fail. A browser that refuses, or has no storage API at all,
 * must still get a working app — the consequence is advice in Settings to keep
 * an export, not a blocked start.
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { StorageDurability, type StorageEstimate } from "@/bootstrap/persistence/StorageDurability"

export interface DurabilityStatus {
  readonly persisted: boolean
  /** False when this run was the one that asked. */
  readonly askedBefore: boolean
  readonly estimate: StorageEstimate
}

const REQUESTED_KEY = "storage-persistence-requested"

const hasAskedBefore = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<{ value: string }>`
    SELECT value FROM app_metadata WHERE key = ${REQUESTED_KEY}
  `
  return rows.length > 0
}).pipe(Effect.catchCause(() => Effect.succeed(false)))

const recordAsked = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`
    INSERT OR REPLACE INTO app_metadata (key, value) VALUES (${REQUESTED_KEY}, 'yes')
  `
}).pipe(Effect.catchCause(() => Effect.void))

export const ensureDurableStorage: Effect.Effect<
  DurabilityStatus,
  never,
  StorageDurability | SqlClient.SqlClient
> = Effect.gen(function* () {
  const durability = yield* StorageDurability
  const askedBefore = yield* hasAskedBefore

  const persisted = (yield* durability.isPersisted)
    ? true
    : askedBefore
      ? false
      : yield* durability.request

  if (!askedBefore) yield* recordAsked

  return { persisted, askedBefore, estimate: yield* durability.estimate }
})
