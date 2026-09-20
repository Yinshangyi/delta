/**
 * Run the projection once per prefix of a scenario's overrides, and diff.
 *
 * `n + 1` projections for `n` changes: the baseline, then each change stacked
 * on the ones before it. That is what makes the decomposition honest — the
 * cost of the holiday is measured *with* the rate rise already applied,
 * because that is the order the household is considering them in.
 */
import { Effect, Match, Option } from "effect"

import { timeCostOf, type TimeCost } from "@/modules/scenarios/core/domain/TimeCost"
import { ScenarioProjections } from "@/modules/scenarios/core/ports/secondary/ScenarioProjections"
import * as LocalDate from "@/shared/domain/LocalDate"

import type { ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"
import type { Projection } from "@/modules/trajectory/core/use_cases/ProjectionQuery"
import type { PersistenceError } from "@/shared/domain/PersistenceError"
import type * as YearMonth from "@/shared/domain/YearMonth"

const targetOf = (projection: Option.Option<Projection>): YearMonth.YearMonth | undefined =>
  Option.match(projection, {
    onNone: () => undefined,
    onSome: (found) =>
      Match.valueTags(found.result.status, {
        Reachable: (reachable) => LocalDate.toYearMonth(reachable.targetDate),
        NotReachable: (): YearMonth.YearMonth | undefined => undefined
      })
  })

export const timeCostOfOverrides = (
  overrides: ReadonlyArray<ScenarioOverride>
): Effect.Effect<TimeCost, PersistenceError, typeof ScenarioProjections.Identifier> =>
  Effect.gen(function* () {
    const projections = yield* ScenarioProjections

    const targets: Array<YearMonth.YearMonth | undefined> = []
    for (let stacked = 0; stacked <= overrides.length; stacked += 1) {
      targets.push(targetOf(yield* projections.under(overrides.slice(0, stacked))))
    }

    return timeCostOf(
      overrides.map((override) => override.id),
      targets
    )
  })
