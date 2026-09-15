/**
 * A freelance daily rate, or TJM (spec §9).
 *
 * Money in its own right, but not any amount of money: a rate of zero or less
 * is a data-entry mistake, and multiplying it by billable days would produce a
 * projection that looks plausible and is wrong.
 */
import { Brand, Data, Result } from "effect"

import * as BillableDays from "@/shared/domain/BillableDays"
import * as Money from "@/shared/domain/Money"

export type DailyRate = Brand.Branded<Money.Money, "DailyRate">

export class InvalidDailyRate extends Data.TaggedError("InvalidDailyRate")<{
  readonly value: number
  readonly reason: "not-positive" | "invalid-amount"
}> {}

export const fromMoney = (amount: Money.Money): Result.Result<DailyRate, InvalidDailyRate> =>
  Money.isPositive(amount)
    ? Result.succeed(amount as DailyRate)
    : Result.fail(new InvalidDailyRate({ value: Money.toCents(amount), reason: "not-positive" }))

export const fromEuros = (euros: number): Result.Result<DailyRate, InvalidDailyRate> =>
  Result.match(Money.fromEuros(euros), {
    onFailure: () => Result.fail(new InvalidDailyRate({ value: euros, reason: "invalid-amount" })),
    onSuccess: fromMoney
  })

export const toMoney = (rate: DailyRate): Money.Money => rate

/** Spec §9: RevenueHT = DailyRate × BillableDays. */
export const revenueFor = (rate: DailyRate, days: BillableDays.BillableDays): Money.Money =>
  Money.multiply(toMoney(rate), BillableDays.toNumber(days))
