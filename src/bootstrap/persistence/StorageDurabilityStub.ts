/**
 * A stub, in Fowler's sense: canned answers, plus `inspect` so a test can
 * assert the request was made exactly once.
 */
import { Effect, Layer } from "effect"

import { StorageDurability, type StorageEstimate } from "@/bootstrap/persistence/StorageDurability"

export interface StorageDurabilityStubOptions {
  readonly granted?: boolean
  readonly alreadyPersisted?: boolean
  readonly estimate?: StorageEstimate
}

export const makeStorageDurabilityStub = (options: StorageDurabilityStubOptions = {}) => {
  const granted = options.granted ?? true
  let requests = 0

  const layer = Layer.succeed(StorageDurability)({
    request: Effect.sync(() => {
      requests += 1
      return granted
    }),
    isPersisted: Effect.sync(() => options.alreadyPersisted ?? false),
    estimate: Effect.succeed(options.estimate ?? { usedBytes: 1_024, quotaBytes: 1_000_000 })
  })

  return { layer, inspect: () => ({ requests }) }
}
