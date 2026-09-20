/**
 * The recorded balances of a debt (spec §21), separate from the debt itself
 * because the two change for different reasons: a debt is set up once, and its
 * balance is recorded again every time the household checks.
 */
import { Context, Effect } from "effect"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { DebtSnapshot, DebtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface DebtHistoryShape {
  readonly nextId: Effect.Effect<DebtSnapshotId>
  readonly all: Effect.Effect<ReadonlyArray<DebtSnapshot>, PersistenceError>
  readonly forDebt: (
    debt: CommitmentId
  ) => Effect.Effect<ReadonlyArray<DebtSnapshot>, PersistenceError>
  readonly record: (snapshot: DebtSnapshot) => Effect.Effect<void, PersistenceError>
  readonly remove: (id: DebtSnapshotId) => Effect.Effect<void, PersistenceError>
}

export const DebtHistory = Context.Service<DebtHistoryShape>("delta/commitments/DebtHistory")
