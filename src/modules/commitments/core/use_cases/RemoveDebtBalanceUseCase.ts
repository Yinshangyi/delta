/** A mistyped balance is removed rather than left to distort the forecast. */
import { Effect } from "effect"

import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"

import type { DebtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const removeDebtBalance = (
  id: DebtSnapshotId
): Effect.Effect<void, PersistenceError, typeof DebtHistory.Identifier> =>
  Effect.gen(function* () {
    const history = yield* DebtHistory
    yield* history.remove(id)
  })
