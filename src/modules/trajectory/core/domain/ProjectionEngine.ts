import {
  empty,
  groupByMonth,
  type MonthlyFlows,
  netOf
} from "@/modules/trajectory/core/domain/MonthlyFlows"
import {
  NotReachable,
  ProjectionMonth,
  ProjectionResult,
  type ProjectionStatus,
  Reachable
} from "@/modules/trajectory/core/domain/ProjectionResult"
/**
 * The heart of Delta (spec §30), and deliberately the dullest code in it:
 * arrays in, arrays out, no Effect, no ports, no I/O, no clock.
 *
 * It never learns that freelancers, debts or tax schedules exist. Each module
 * translates itself into dated `CashFlow`s and the engine adds them up, which
 * is what makes a new income type a change in one module rather than here
 * (spec §7, §17, §29).
 *
 * **Starting capital is gross** (spec §77). Subtracting outstanding debt looks
 * like a correction and is a double count: the debt is already arriving as
 * scheduled negative cash flows, so netting it off the opening balance as well
 * pushes the target date out by the whole amount owed. `notReachableByDoubleCountingDebt`
 * in the tests is the guard.
 */
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type * as CashFlow from "@/shared/domain/CashFlow"

/** Spec §32 asks for a limit and leaves the number to us. 50 years. */
export const DEFAULT_HORIZON_MONTHS = 600

export interface ProjectionInput {
  readonly cashFlows: ReadonlyArray<CashFlow.CashFlow>
  /** Gross capital. Never net of debt — see the note above. */
  readonly startingCapital: Money.Money
  readonly target: Money.Money
  /**
   * Where the projection starts. Passed rather than read from a clock, which
   * is what makes the same inputs give the same output on any machine in any
   * timezone, and what lets a golden file exist at all.
   */
  readonly from: YearMonth.YearMonth
  readonly horizonMonths?: number
}

const stepThrough = (
  month: YearMonth.YearMonth,
  startingSavings: Money.Money,
  flows: MonthlyFlows
): ProjectionMonth => {
  const netCashFlow = netOf(flows)
  return new ProjectionMonth({
    month,
    startingSavings,
    income: flows.income,
    commitments: flows.commitments,
    netCashFlow,
    endingSavings: Money.add(startingSavings, netCashFlow),
    cashFlows: flows.flows
  })
}

const lastMonthOf = (
  byMonth: ReadonlyMap<YearMonth.YearMonth, MonthlyFlows>
): YearMonth.YearMonth | undefined =>
  [...byMonth.keys()].reduce<YearMonth.YearMonth | undefined>(
    (latest, month) => (latest === undefined || YearMonth.isAfter(month, latest) ? month : latest),
    undefined
  )

const reached = (month: ProjectionMonth, index: number): ProjectionStatus =>
  new Reachable({
    targetDate: LocalDate.lastDayOf(month.month),
    monthsRemaining: index + 1
  })

export const project = (input: ProjectionInput): ProjectionResult => {
  const byMonth = groupByMonth(input.cashFlows)
  const lastFlowMonth = lastMonthOf(byMonth)
  const horizon = input.horizonMonths ?? DEFAULT_HORIZON_MONTHS

  const months: Array<ProjectionMonth> = []
  let savings = input.startingCapital
  let status: ProjectionStatus = new NotReachable({ reason: "horizon" })

  for (let index = 0; index < horizon; index += 1) {
    const month = YearMonth.addMonths(input.from, index)
    const projected = stepThrough(month, savings, byMonth.get(month) ?? empty(month))
    months.push(projected)
    savings = projected.endingSavings

    if (Money.isGreaterThanOrEqualTo(savings, input.target)) {
      status = reached(projected, index)
      break
    }

    /*
     * Past the last dated flow the net is zero for every remaining month, so
     * the balance can never move again. Running to the horizon to discover
     * that would produce hundreds of identical rows for a screen to render.
     */
    if (lastFlowMonth === undefined || !YearMonth.isBefore(month, lastFlowMonth)) {
      status = new NotReachable({ reason: "flows-exhausted" })
      break
    }
  }

  return new ProjectionResult({
    startingSavings: input.startingCapital,
    targetAmount: input.target,
    status,
    months
  })
}
