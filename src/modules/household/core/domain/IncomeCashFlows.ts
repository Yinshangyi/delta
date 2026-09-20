/**
 * Income turned into dated amounts (spec §9, §12, §63). Pure functions over
 * values — no Effect, no clock, no I/O — so the arithmetic is a unit test and
 * the engine downstream never learns what produced a flow.
 */
import { Match } from "effect"

import {
  daysIn,
  type FreelanceIncome,
  type IncomeSource,
  type SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as YearMonth from "@/shared/domain/YearMonth"

/** Spec §9: RevenueHT = DailyRate × BillableDays, then × the payout ratio. */
const freelanceAmount = (source: FreelanceIncome, month: YearMonth.YearMonth): Money.Money => {
  const days = daysIn(source.billableDays, month)
  const revenue = DailyRate.revenueFor(source.dailyRate, days)
  return PayoutRatio.applyTo(revenue, source.estimatedPayoutRatio)
}

/** Spec §12: net after tax is the difference, and no payroll engine exists. */
const salaryAmount = (source: SalaryIncome): Money.Money =>
  Money.subtract(source.monthlyNetBeforeTax, source.monthlyIncomeTax)

interface Contribution {
  readonly amount: Money.Money
  /** A label for the month-by-month table, never something to branch on. */
  readonly kind: string
}

const contributionIn = (source: IncomeSource, month: YearMonth.YearMonth): Contribution =>
  Match.valueTags(source, {
    FreelanceIncome: (freelance): Contribution => ({
      amount: freelanceAmount(freelance, month),
      kind: "freelance"
    }),
    SalaryIncome: (salary): Contribution => ({ amount: salaryAmount(salary), kind: "salary" })
  })

/**
 * Dated on the last day of the month, which is where balance snapshots land
 * (spec §15) — a flow and the balance it changes belong to the same instant.
 */
export const cashFlowsFor = (
  source: IncomeSource,
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
): ReadonlyArray<CashFlow.CashFlow> => {
  if (!source.enabled) return []

  return ActivePeriod.monthsIn(source.period, from, to).map((month) => {
    const { amount, kind } = contributionIn(source, month)
    return CashFlow.make({
      date: LocalDate.lastDayOf(month),
      amount,
      sourceId: source.id,
      sourceKind: kind
    })
  })
}

/** A month with nothing billed earns nothing, which is a real answer (spec §11). */
export const billsNothing = (source: FreelanceIncome, month: YearMonth.YearMonth): boolean =>
  BillableDays.toNumber(daysIn(source.billableDays, month)) === 0
