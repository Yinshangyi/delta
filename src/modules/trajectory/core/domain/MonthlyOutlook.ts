/**
 * What a month usually looks like, and what it looks like on average (TRJ-06).
 *
 * Two figures rather than one, deliberately. A single "expected monthly
 * savings" number has to either include the scheduled payments — an annual tax
 * bill spread invisibly across twelve months, understating what most months
 * actually leave — or exclude them, overstating the rate several-fold. Either
 * way the number is a claim the household cannot check.
 *
 * So: the **typical** month is the median, which is what most months look
 * like; the **average** spreads everything across the window, scheduled
 * payments included. Where they differ, something lumpy is happening, and the
 * screen says so rather than picking a side.
 *
 * Note what this does *not* do: it never asks which flows are tax. Branching
 * on a commitment's kind here is exactly what spec §17 forbids downstream, and
 * the median answers the question without it.
 */
import { Data } from "effect"

import * as Money from "@/shared/domain/Money"

import type { ProjectionResult } from "@/modules/trajectory/core/domain/ProjectionResult"

export class MonthlyOutlook extends Data.Class<{
  readonly typicalIncome: Money.Money
  readonly typicalCommitments: Money.Money
  /** The median month: what most months leave. */
  readonly typicalNet: Money.Money
  /** The mean across the window, scheduled payments and one-offs included. */
  readonly averageNet: Money.Money
  readonly windowMonths: number
  /** True where lumpy payments make the two figures disagree. */
  readonly lumpy: boolean
}> {}

const median = (amounts: ReadonlyArray<Money.Money>): Money.Money => {
  if (amounts.length === 0) return Money.zero
  const sorted = [...amounts].sort(Money.Order)
  const middle = Math.floor(sorted.length / 2)
  return sorted[middle] ?? Money.zero
}

const mean = (amounts: ReadonlyArray<Money.Money>): Money.Money =>
  amounts.length === 0 ? Money.zero : Money.multiply(Money.sum(amounts), 1 / amounts.length)

export const DEFAULT_WINDOW_MONTHS = 12

export const outlookOver = (
  result: ProjectionResult,
  windowMonths: number = DEFAULT_WINDOW_MONTHS
): MonthlyOutlook => {
  const window = result.months.slice(0, windowMonths)
  const typicalNet = median(window.map((month) => month.netCashFlow))
  const averageNet = mean(window.map((month) => month.netCashFlow))

  return new MonthlyOutlook({
    typicalIncome: median(window.map((month) => month.income)),
    typicalCommitments: median(window.map((month) => month.commitments)),
    typicalNet,
    averageNet,
    windowMonths: window.length,
    lumpy: !Money.equals(typicalNet, averageNet)
  })
}
