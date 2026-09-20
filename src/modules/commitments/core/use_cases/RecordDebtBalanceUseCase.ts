/**
 * Record what is actually still owed (spec §21, §2.3).
 *
 * This is the recalibration loop's input: Delta's forecast is a guess and the
 * household has the real number, so the snapshot becomes the source of truth
 * and everything after it is recomputed from there.
 */
import { Effect } from "effect"

import { DebtSnapshot } from "@/modules/commitments/core/domain/DebtSnapshot"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { DebtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface DebtBalanceDraft {
  readonly debt: CommitmentId
  readonly date: string
  readonly remainingEuros: number
  /** Present when an earlier snapshot is being corrected rather than added to. */
  readonly existing: DebtSnapshotId | undefined
}

export const recordDebtBalance = (
  draft: DebtBalanceDraft
): Effect.Effect<
  DebtSnapshot,
  Money.InvalidMoney | LocalDate.InvalidLocalDate | PersistenceError,
  typeof DebtHistory.Identifier
> =>
  Effect.gen(function* () {
    const date = yield* Effect.fromResult(LocalDate.parse(draft.date))
    const remainingAmount = yield* Effect.fromResult(Money.fromEuros(draft.remainingEuros))

    const history = yield* DebtHistory
    const snapshot = new DebtSnapshot({
      id: draft.existing ?? (yield* history.nextId),
      debtId: draft.debt,
      date,
      remainingAmount
    })

    yield* history.record(snapshot)
    return snapshot
  })
