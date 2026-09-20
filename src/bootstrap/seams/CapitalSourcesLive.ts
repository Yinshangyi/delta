/**
 * The projection's starting balance, from `capital` (spec §73, §77).
 *
 * At the composition root for the same reason as `CashFlowSourcesLive`: it
 * adapts one module's use case into another module's port, and that is the
 * root's job rather than an adapter's.
 */
import { Effect, Layer } from "effect"

import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { totalCapitalAt } from "@/modules/capital/core/use_cases/CapitalSourcesQuery"
import {
  CapitalSources,
  type CapitalSourcesShape
} from "@/modules/trajectory/core/ports/secondary/CapitalSources"

export const CapitalSourcesLive: Layer.Layer<
  typeof CapitalSources.Identifier,
  never,
  typeof Holdings.Identifier | typeof ValuationHistory.Identifier
> = Layer.effect(CapitalSources)(
  Effect.gen(function* () {
    const holdings = yield* Holdings
    const valuations = yield* ValuationHistory

    const shape: CapitalSourcesShape = {
      totalAt: (on) =>
        totalCapitalAt(on).pipe(
          Effect.provideService(Holdings, holdings),
          Effect.provideService(ValuationHistory, valuations)
        )
    }

    return shape
  })
)
