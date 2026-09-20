/** A mistyped valuation is removed rather than left distorting capital. */
import { Effect } from "effect"

import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"

import type { BalanceSnapshotId } from "@/modules/capital/core/domain/BalanceSnapshot"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const removeValuation = (
  id: BalanceSnapshotId
): Effect.Effect<void, PersistenceError, typeof ValuationHistory.Identifier> =>
  Effect.gen(function* () {
    const valuations = yield* ValuationHistory
    yield* valuations.remove(id)
  })
