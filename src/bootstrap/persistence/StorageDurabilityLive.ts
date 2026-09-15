/**
 * Every call is wrapped so it cannot fail: a browser that has no
 * `navigator.storage`, or refuses to answer, must not stop the app from
 * starting. "We could not tell" and "not persisted" lead to the same advice.
 */
import { Effect, Layer } from "effect"

import { StorageDurability } from "@/bootstrap/persistence/StorageDurability"

const storage = (): StorageManager | undefined =>
  typeof navigator === "undefined" ? undefined : navigator.storage

export const StorageDurabilityLive: Layer.Layer<StorageDurability> = Layer.succeed(
  StorageDurability
)({
  request: Effect.promise(async () => (await storage()?.persist?.()) ?? false).pipe(
    Effect.catchCause(() => Effect.succeed(false))
  ),

  isPersisted: Effect.promise(async () => (await storage()?.persisted?.()) ?? false).pipe(
    Effect.catchCause(() => Effect.succeed(false))
  ),

  estimate: Effect.promise(async () => {
    const estimate = await storage()?.estimate?.()
    return { usedBytes: estimate?.usage, quotaBytes: estimate?.quota }
  }).pipe(Effect.catchCause(() => Effect.succeed({ usedBytes: undefined, quotaBytes: undefined })))
})
