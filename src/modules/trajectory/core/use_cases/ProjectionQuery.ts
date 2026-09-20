/**
 * The whole answer: when does the household reach its goal?
 *
 * Three narrow questions — the goal, the starting capital, the cash flows —
 * assembled and handed to a pure function. This is the first place all of
 * Delta's arithmetic runs together, and it still knows nothing about
 * freelancers, debts or watches.
 *
 * `from` is passed in rather than read from a clock, so the same data gives
 * the same answer on any machine and a test needs no fake time.
 */
import { Data, Effect, Option } from "effect"

import { DEFAULT_HORIZON_MONTHS, project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import { CashFlowSources } from "@/modules/trajectory/core/ports/secondary/CashFlowSources"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { FinancialGoal } from "@/modules/trajectory/core/domain/FinancialGoal"
import type { ProjectionResult } from "@/modules/trajectory/core/domain/ProjectionResult"
import type * as Money from "@/shared/domain/Money"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export class Projection extends Data.Class<{
  readonly goal: FinancialGoal
  readonly startingCapital: Money.Money
  readonly result: ProjectionResult
}> {}

export interface ProjectionRequest {
  readonly from: YearMonth.YearMonth
  readonly horizonMonths?: number
}

/**
 * `Option.none` when there is no enabled goal — an ordinary state on a
 * new household, and the dashboard says so rather than showing a projection
 * toward nothing (spec §65).
 */
export const projectionFrom = (
  request: ProjectionRequest
): Effect.Effect<
  Option.Option<Projection>,
  PersistenceError,
  typeof Goals.Identifier | typeof CapitalSources.Identifier | typeof CashFlowSources.Identifier
> =>
  Effect.gen(function* () {
    const goals = yield* Goals
    const current = yield* goals.enabled
    if (Option.isNone(current)) return Option.none()

    const goal = current.value
    const horizon = request.horizonMonths ?? DEFAULT_HORIZON_MONTHS

    const capital = yield* CapitalSources
    const startingCapital = yield* capital.totalAt(LocalDate.lastDayOf(request.from))

    const sources = yield* CashFlowSources
    const cashFlows = yield* sources.between(
      request.from,
      YearMonth.addMonths(request.from, horizon)
    )

    return Option.some(
      new Projection({
        goal,
        startingCapital,
        result: project({
          cashFlows,
          startingCapital,
          target: goal.targetAmount,
          from: request.from,
          horizonMonths: horizon
        })
      })
    )
  })
