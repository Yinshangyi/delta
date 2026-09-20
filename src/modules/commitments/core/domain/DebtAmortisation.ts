/**
 * Repayment arithmetic (spec §22), pure and unremarkable on purpose.
 *
 * Two rules carry the whole thing, and both are the ones that get written
 * wrong. **The final payment never exceeds the remaining balance** — €400 left
 * against a €900 payment pays €400 — and **once the balance is zero the debt
 * produces nothing at all**, rather than continuing to bill a paid-off loan.
 *
 * The interest rate is recorded on the debt but not applied here: spec §22
 * defines the arithmetic as `max(0, current − payment)` and leaves compounding
 * unspecified, and a compounding convention Delta invented would be a wrong
 * number presented with the same confidence as a right one. A debt with a rate
 * projects as though it were interest-free, which is stated where it is shown.
 */
import { Data } from "effect"

import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { Debt } from "@/modules/commitments/core/domain/Commitment"

/** What is actually paid this month, and what is left afterwards. */
export class Instalment extends Data.Class<{
  readonly month: YearMonth.YearMonth
  readonly payment: Money.Money
  readonly remainingAfter: Money.Money
}> {}

/** Spec §22: never more than what is left. */
export const paymentFor = (remaining: Money.Money, regular: Money.Money): Money.Money =>
  Money.min(remaining, Money.max(regular, Money.zero))

export const nextBalance = (remaining: Money.Money, payment: Money.Money): Money.Money =>
  Money.max(Money.zero, Money.subtract(remaining, payment))

/**
 * Every instalment from an opening balance until the debt is paid or the last
 * month asked for, whichever comes first.
 *
 * A payment of zero or less would never reduce the balance, so it yields
 * nothing rather than an endless schedule of no-ops.
 */
export const instalments = (
  debt: Debt,
  opening: Money.Money,
  from: YearMonth.YearMonth,
  to: YearMonth.YearMonth
): ReadonlyArray<Instalment> => {
  if (!Money.isPositive(debt.regularPaymentAmount)) return []

  const schedule: Array<Instalment> = []
  let remaining = opening

  for (const month of YearMonth.range(from, to)) {
    if (!Money.isPositive(remaining)) break
    const payment = paymentFor(remaining, debt.regularPaymentAmount)
    remaining = nextBalance(remaining, payment)
    schedule.push(new Instalment({ month, payment, remainingAfter: remaining }))
  }

  return schedule
}

export class DebtProgress extends Data.Class<{
  readonly initial: Money.Money
  readonly remaining: Money.Money
  readonly repaid: Money.Money
  /** 0–100, for a bar and a sentence. Whole percent is as precise as it reads. */
  readonly percentRepaid: number
  /** Absent when the payment could never clear it (spec §22's zero case aside). */
  readonly paymentsRemaining: number | undefined
  readonly payoffMonth: YearMonth.YearMonth | undefined
}> {}

/** Spec §23's panel, as numbers: €11,000 → €7,200, 35% repaid, 8 months left. */
export const progressOf = (
  debt: Debt,
  remaining: Money.Money,
  nextPaymentMonth: YearMonth.YearMonth
): DebtProgress => {
  const repaid = Money.max(Money.zero, Money.subtract(debt.initialAmount, remaining))
  const payments = Money.isPositive(debt.regularPaymentAmount)
    ? Math.ceil(Money.toCents(remaining) / Money.toCents(debt.regularPaymentAmount))
    : undefined

  return new DebtProgress({
    initial: debt.initialAmount,
    remaining,
    repaid,
    percentRepaid: Money.isPositive(debt.initialAmount)
      ? Math.round((Money.toCents(repaid) / Money.toCents(debt.initialAmount)) * 100)
      : 100,
    paymentsRemaining: payments,
    payoffMonth:
      payments === undefined || payments === 0
        ? undefined
        : YearMonth.addMonths(nextPaymentMonth, payments - 1)
  })
}
