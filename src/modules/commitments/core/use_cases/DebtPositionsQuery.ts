/**
 * Where every debt stands, resolved once.
 *
 * Both the cash-flow query and the detail panel need it, and computing it
 * twice would mean two places deciding whether a snapshot beats the forecast
 * (spec §21).
 */
import { Effect, Match } from "effect"

import { positionOf } from "@/modules/commitments/core/domain/DebtPosition"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"

import type { Commitment, CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"
import type { DebtSnapshot } from "@/modules/commitments/core/domain/DebtSnapshot"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const positionsOf = (
  commitments: ReadonlyArray<Commitment>,
  snapshots: ReadonlyArray<DebtSnapshot>
): ReadonlyMap<CommitmentId, DebtPosition> =>
  new Map(
    commitments.flatMap((commitment) =>
      Match.valueTags(commitment, {
        RecurringExpense: () => [],
        OneOffExpense: () => [],
        Debt: (debt) => [
          [
            debt.id,
            positionOf(
              debt,
              snapshots.filter((snapshot) => snapshot.debtId === debt.id)
            )
          ] as const
        ],
        TaxLiability: () => [],
        RecurringTaxPayment: () => []
      })
    )
  )

export const debtPositions: Effect.Effect<
  ReadonlyMap<CommitmentId, DebtPosition>,
  PersistenceError,
  typeof Commitments.Identifier | typeof DebtHistory.Identifier
> = Effect.gen(function* () {
  const commitments = yield* Commitments
  const history = yield* DebtHistory
  return positionsOf(yield* commitments.all, yield* history.all)
})
