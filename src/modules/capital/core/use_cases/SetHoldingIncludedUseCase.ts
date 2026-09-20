/**
 * Include or exclude a holding from capital (spec §72, CAP-07).
 *
 * The flag is persistent configuration, not a filter: it survives a restart,
 * and it never deletes the holding or its history. Excluding everything is a
 * legitimate answer — "how far are we if we count nothing?" — which produces
 * capital of €0 rather than an error.
 */
import { Effect } from "effect"

import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const setHoldingIncluded = (
  id: HoldingId,
  included: boolean
): Effect.Effect<void, PersistenceError, typeof Holdings.Identifier> =>
  Effect.gen(function* () {
    const holdings = yield* Holdings
    yield* holdings.setIncluded(id, included)
  })
