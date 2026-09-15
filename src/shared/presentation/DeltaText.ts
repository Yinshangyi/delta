/**
 * A change, always carrying its direction (design-brief.md — Formatting
 * conventions). `3 months` is ambiguous and therefore useless; `3 months
 * sooner` is an answer.
 *
 * Money is serious and sometimes unwelcome news. These read as information,
 * not as failure — "behind plan", never "you are behind".
 */
import * as Money from "@/shared/domain/Money"
import { money } from "@/shared/presentation/MoneyText"

const months = (count: number): string => `${count} ${count === 1 ? "month" : "months"}`

/**
 * A moved target date. Negative is earlier, because the delta is measured
 * against the previous estimate: fewer months to wait.
 */
export const targetDateShift = (monthsMoved: number): string => {
  if (monthsMoved === 0) return "no change"
  return monthsMoved < 0
    ? `${months(Math.abs(monthsMoved))} sooner`
    : `${months(monthsMoved)} later`
}

/** Actual savings measured against the forecast. */
export const againstPlan = (difference: Money.Money): string => {
  if (Money.isZero(difference)) return "on plan"
  const size = money(Money.abs(difference))
  return Money.isNegative(difference) ? `${size} behind plan` : `${size} ahead of plan`
}

/** For tables and chart labels, where the sign is the direction. */
export const signedMoney = (amount: Money.Money): string =>
  Money.isNegative(amount) ? `-${money(Money.abs(amount))}` : `+${money(amount)}`
