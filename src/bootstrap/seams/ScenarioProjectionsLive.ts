/**
 * The same engine, under a different layer (spec §36, architecture.md's second
 * seam).
 *
 * This is where a scenario actually happens. It builds overridden
 * implementations of `CashFlowSources` and `CapitalSources`, provides them to
 * the *unchanged* `projectionFrom`, and hands back the result. The engine is
 * never told a scenario is active; nothing downstream branches on one.
 *
 * At the composition root rather than in an adapter for the usual reason: it
 * composes three modules' use cases, and an adapter importing a use case has
 * the arrow backwards.
 */
import { Effect, Layer, Option } from "effect"

import { totalOf } from "@/modules/capital/core/domain/TotalCapital"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { capitalOverviewAt } from "@/modules/capital/core/use_cases/CapitalOverviewQuery"
import { cashFlowsFor } from "@/modules/commitments/core/domain/CommitmentCashFlows"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { positionsOf } from "@/modules/commitments/core/use_cases/DebtPositionsQuery"
import { householdId } from "@/modules/household/core/domain/Household"
import { cashFlowsFor as incomeCashFlowsFor } from "@/modules/household/core/domain/IncomeCashFlows"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { overriddenCommitments } from "@/modules/scenarios/core/domain/OverrideCommitments"
import { overriddenHoldings } from "@/modules/scenarios/core/domain/OverrideHoldings"
import { overriddenIncome } from "@/modules/scenarios/core/domain/OverrideIncome"
import {
  ScenarioProjections,
  type ScenarioProjectionsShape
} from "@/modules/scenarios/core/ports/secondary/ScenarioProjections"
import { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import { CashFlowSources } from "@/modules/trajectory/core/ports/secondary/CashFlowSources"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import { projectionFrom } from "@/modules/trajectory/core/use_cases/ProjectionQuery"

import type { ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as YearMonth from "@/shared/domain/YearMonth"

export interface ScenarioWindow {
  readonly from: YearMonth.YearMonth
  readonly asOf: LocalDate.LocalDate
}

type Sources =
  | typeof IncomeSources.Identifier
  | typeof HouseholdConfiguration.Identifier
  | typeof Commitments.Identifier
  | typeof DebtHistory.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier
  | typeof Goals.Identifier

const overriddenCashFlows = (overrides: ReadonlyArray<ScenarioOverride>) =>
  Layer.effect(CashFlowSources)(
    Effect.gen(function* () {
      const incomes = yield* IncomeSources
      const commitments = yield* Commitments
      const history = yield* DebtHistory
      const configuration = yield* HouseholdConfiguration

      return {
        between: (from, to) =>
          Effect.gen(function* () {
            /*
              A hypothetical purchase has to belong to a household like any
              other commitment. Behind the household gate there is always one;
              with none there is nothing to project anyway, and the overrides
              that need an owner add nothing to an empty household.
            */
            const owner = Option.map(yield* configuration.current, (household) => household.id)

            const sources = overriddenIncome(yield* incomes.all, overrides)
            const withChanges = overriddenCommitments(
              yield* commitments.all,
              overrides,
              Option.getOrElse(owner, () => householdId(""))
            )
            const positions = positionsOf(withChanges, yield* history.all)

            return [
              ...sources.flatMap((source) => incomeCashFlowsFor(source, from, to)),
              ...withChanges.flatMap((commitment) => cashFlowsFor(commitment, positions, from, to))
            ]
          })
      }
    })
  )

const overriddenCapital = (overrides: ReadonlyArray<ScenarioOverride>) =>
  Layer.effect(CapitalSources)(
    Effect.gen(function* () {
      const holdings = yield* Holdings
      const valuations = yield* ValuationHistory

      return {
        totalAt: (on) =>
          capitalOverviewAt(on).pipe(
            Effect.provideService(Holdings, holdings),
            Effect.provideService(ValuationHistory, valuations),
            Effect.map((overview) =>
              totalOf(overriddenHoldings([...overview.accounts, ...overview.assets], overrides))
            )
          ),
        recordedDates: valuations.all.pipe(Effect.map(() => []))
      }
    })
  )

export const scenarioProjectionsLive = (
  window: ScenarioWindow
): Layer.Layer<typeof ScenarioProjections.Identifier, never, Sources> =>
  Layer.effect(ScenarioProjections)(
    Effect.gen(function* () {
      const goals = yield* Goals
      const incomes = yield* IncomeSources
      const configuration = yield* HouseholdConfiguration
      const commitments = yield* Commitments
      const history = yield* DebtHistory
      const holdings = yield* Holdings
      const valuations = yield* ValuationHistory

      const shape: ScenarioProjectionsShape = {
        under: (overrides) =>
          projectionFrom(window).pipe(
            Effect.provide(
              Layer.mergeAll(overriddenCashFlows(overrides), overriddenCapital(overrides)).pipe(
                Layer.provideMerge(
                  Layer.mergeAll(
                    Layer.succeed(IncomeSources)(incomes),
                    Layer.succeed(HouseholdConfiguration)(configuration),
                    Layer.succeed(Commitments)(commitments),
                    Layer.succeed(DebtHistory)(history),
                    Layer.succeed(Holdings)(holdings),
                    Layer.succeed(ValuationHistory)(valuations)
                  )
                )
              )
            ),
            Effect.provideService(Goals, goals)
          )
      }

      return shape
    })
  )
