import { Effect } from "effect"

import { StorageDurability } from "@/bootstrap/persistence/StorageDurability"
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"

export interface StorageReport {
  readonly persisted: boolean
  readonly usedBytes: number | undefined
  readonly quotaBytes: number | undefined
}

/**
 * The first atom in the project, and deliberately a small one: two reads off a
 * service that cannot fail, so the shape gets established before a screen with
 * real stakes copies it.
 *
 * Note what is *not* here — no domain transformation, no error branching, no
 * second port. An atom is glue; anything more belongs in a use case.
 */
export const storageAtom = appRuntime.atom(
  Effect.gen(function* () {
    const durability = yield* StorageDurability
    const persisted = yield* durability.isPersisted
    const estimate = yield* durability.estimate
    return { persisted, ...estimate } satisfies StorageReport
  })
)
