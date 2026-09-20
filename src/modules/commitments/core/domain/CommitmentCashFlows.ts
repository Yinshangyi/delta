/**
 * Commitments turned into dated negative amounts (spec §17, §29).
 *
 * This is the only place that knows what each kind means. Below it the
 * projection sees five kinds of nothing: dated amounts with a sign. That is
 * what spec §17 is asking for when it forbids `if (commitment.type === "tax")`
 * downstream — the branch exists, exactly once, here.
 *
 * A tax schedule is emitted as its own dated rows and is **never** collapsed
 * into a monthly average (spec §25): €5,303, €5,303, €5,303, €5,306 land on
 * their configured dates, and the uneven final instalment is the reason.
 */
import { Match } from "effect"

import { instalments } from "@/modules/commitments/core/domain/DebtAmortisation"
import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type {
  Commitment,
  CommitmentId,
  Debt,
  OneOffExpense,
  RecurringExpense,
  RecurringTaxPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"

const outflow = (
  date: LocalDate.LocalDate,
  amount: Money.Money,
  sourceId: CommitmentId,
  sourceKind: string
) =>
  CashFlow.make({
    date,
    amount: Money.negate(Money.abs(amount)),
    sourceId,
    sourceKind
  })

/** Dated on the last day of the month, where income lands and balances are read. */
const monthly = (
  commitment: RecurringExpense | RecurringTaxPayment,
  kind: string,
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
) =>
  ActivePeriod.monthsIn(commitment.period, from, to).map((month) =>
    outflow(LocalDate.lastDayOf(month), commitment.amount, commitment.id, kind)
  )

const oneOff = (expense: OneOffExpense, from: YearMonth.YearMonth, to: YearMonth.YearMonth) => {
  const month = LocalDate.toYearMonth(expense.date)
  return YearMonth.isBefore(month, from) || YearMonth.isAfter(month, to)
    ? []
    : [outflow(expense.date, expense.amount, expense.id, "one-off")]
}

const repayments = (
  debt: Debt,
  position: DebtPosition | undefined,
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
) => {
  if (position === undefined) return []
  const start = YearMonth.isAfter(position.from, from) ? position.from : from
  if (YearMonth.isAfter(start, to)) return []

  return instalments(debt, position.remaining, start, to).map((instalment) =>
    outflow(LocalDate.lastDayOf(instalment.month), instalment.payment, debt.id, "debt")
  )
}

const scheduled = (tax: TaxLiability, from: YearMonth.YearMonth, to: YearMonth.YearMonth) =>
  tax.paymentSchedule
    .filter((payment) => {
      const month = LocalDate.toYearMonth(payment.date)
      return !YearMonth.isBefore(month, from) && !YearMonth.isAfter(month, to)
    })
    .map((payment) => outflow(payment.date, payment.amount, tax.id, "tax"))

export const cashFlowsFor = (
  commitment: Commitment,
  positions: ReadonlyMap<CommitmentId, DebtPosition>,
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
): ReadonlyArray<CashFlow.CashFlow> => {
  if (!commitment.enabled) return []

  return Match.valueTags(commitment, {
    RecurringExpense: (expense) => monthly(expense, "expense", from, to),
    OneOffExpense: (expense) => oneOff(expense, from, to),
    Debt: (debt) => repayments(debt, positions.get(debt.id), from, to),
    TaxLiability: (tax) => scheduled(tax, from, to),
    RecurringTaxPayment: (payment) => monthly(payment, "tax-payment", from, to)
  })
}
