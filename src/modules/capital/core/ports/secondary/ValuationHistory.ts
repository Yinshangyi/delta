/**
 * The dated valuations of every holding (spec §71), separate from the holdings
 * themselves because the two change for different reasons: an account is
 * opened once and its balance is recorded again every month.
 */
import { Context, Effect } from "effect"

import type {
  BalanceSnapshot,
  BalanceSnapshotId
} from "@/modules/capital/core/domain/BalanceSnapshot"
import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface ValuationHistoryShape {
  readonly nextId: Effect.Effect<BalanceSnapshotId>
  readonly all: Effect.Effect<ReadonlyArray<BalanceSnapshot>, PersistenceError>
  readonly forHolding: (
    holding: HoldingId
  ) => Effect.Effect<ReadonlyArray<BalanceSnapshot>, PersistenceError>
  readonly record: (snapshot: BalanceSnapshot) => Effect.Effect<void, PersistenceError>
  readonly remove: (id: BalanceSnapshotId) => Effect.Effect<void, PersistenceError>
}

export const ValuationHistory = Context.Service<ValuationHistoryShape>(
  "delta/capital/ValuationHistory"
)
