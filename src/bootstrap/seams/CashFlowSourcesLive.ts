/**
 * Where the modules finally meet (architecture.md — "the composition root is
 * where the two sides meet").
 *
 * This lives in `bootstrap/` rather than in `trajectory/secondary_adapters/`
 * because it composes two other modules' use cases, and an adapter importing a
 * use case has the arrow backwards — `secondary-no-application-layer` says so,
 * and it is right. Composition is the root's job.
 *
 * The result is that `household` and `commitments` do not know each other
 * exists, and `trajectory` knows neither.
 */
import { Effect, Layer } from "effect"

import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { commitmentCashFlowsBetween } from "@/modules/commitments/core/use_cases/CommitmentCashFlowsQuery"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { householdCashFlowsBetween } from "@/modules/household/core/use_cases/HouseholdCashFlowsQuery"
import {
  CashFlowSources,
  type CashFlowSourcesShape
} from "@/modules/trajectory/core/ports/secondary/CashFlowSources"

export const CashFlowSourcesLive: Layer.Layer<
  typeof CashFlowSources.Identifier,
  never,
  typeof IncomeSources.Identifier | typeof Commitments.Identifier | typeof DebtHistory.Identifier
> = Layer.effect(CashFlowSources)(
  Effect.gen(function* () {
    /*
      Captured once, at layer build, and handed back to each query on every
      call. The queries are written against their own module's ports, so the
      root is what supplies them — not a wider context leaking downward.
    */
    const income = yield* IncomeSources
    const commitments = yield* Commitments
    const history = yield* DebtHistory

    const shape: CashFlowSourcesShape = {
      between: (from, to) =>
        Effect.gen(function* () {
          const earned = yield* householdCashFlowsBetween(from, to)
          const owed = yield* commitmentCashFlowsBetween(from, to)
          return [...earned, ...owed]
        }).pipe(
          Effect.provideService(IncomeSources, income),
          Effect.provideService(Commitments, commitments),
          Effect.provideService(DebtHistory, history)
        )
    }

    return shape
  })
)
