/**
 * Why a goal is out of reach, in the only terms that help: what the household
 * is actually putting aside each month (TRJ-09).
 *
 * "Not reachable" on its own is a dead end. "You are about €400 a month short"
 * is a number someone can act on, and it is the same number a scenario would
 * change.
 */
import { Result } from "effect"

import * as Money from "@/shared/domain/Money"

import type { ProjectionResult } from "@/modules/trajectory/core/domain/ProjectionResult"

/**
 * The average, not the last month: a projection whose final month happens to
 * carry an annual tax payment would otherwise report a shortfall several times
 * the real one.
 */
export const averageMonthlyNet = (result: ProjectionResult): Money.Money | undefined => {
  if (result.months.length === 0) return undefined

  const total = Money.sum(result.months.map((month) => month.netCashFlow))
  const average = Money.fromCents(Math.round(Money.toCents(total) / result.months.length))
  return Result.getOrUndefined(average)
}
