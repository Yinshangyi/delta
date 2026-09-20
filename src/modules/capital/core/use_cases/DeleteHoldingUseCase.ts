/**
 * Permanent, unlike excluding (CAP-09). The holding's valuation history goes
 * with it — the schema cascades — which is why the confirmation says so before
 * the fact rather than the list quietly shrinking afterwards.
 */
import { Effect } from "effect"

import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const deleteHolding = (
  id: HoldingId
): Effect.Effect<void, PersistenceError, typeof Holdings.Identifier> =>
  Effect.gen(function* () {
    const holdings = yield* Holdings
    yield* holdings.remove(id)
  })
