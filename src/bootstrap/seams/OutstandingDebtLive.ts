/**
 * What is still owed, for the net-worth display alone (spec §77, CAP-11).
 *
 * Reads the same figure the commitments screen shows, so the two cannot
 * disagree — and reaches the engine through no path at all.
 */
import { Effect, Layer } from "effect"

import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { commitmentsOverview } from "@/modules/commitments/core/use_cases/CommitmentsOverviewQuery"
import {
  OutstandingDebt,
  type OutstandingDebtShape
} from "@/modules/trajectory/core/ports/secondary/OutstandingDebt"

export const OutstandingDebtLive: Layer.Layer<
  typeof OutstandingDebt.Identifier,
  never,
  typeof Commitments.Identifier | typeof DebtHistory.Identifier
> = Layer.effect(OutstandingDebt)(
  Effect.gen(function* () {
    const commitments = yield* Commitments
    const history = yield* DebtHistory

    const shape: OutstandingDebtShape = {
      total: commitmentsOverview.pipe(
        Effect.map((overview) => overview.totals.outstandingDebt),
        Effect.provideService(Commitments, commitments),
        Effect.provideService(DebtHistory, history)
      )
    }

    return shape
  })
)
