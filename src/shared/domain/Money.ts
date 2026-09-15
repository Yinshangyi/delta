/**
 * A projection is thousands of additions deep and terminates on
 * `balance >= target`. Euros as floats are inexact — `0.1 + 0.2 !== 0.3` — and
 * at that threshold a sub-microcent shortfall costs a whole month: saving
 * €0.10 toward €10.00 reaches the goal at month 101, not 100. Integer cents
 * are exact, and exactness is what spec §57 means by determinism.
 *
 * Formatting lives in the presentation vocabulary, never here — the domain has
 * no opinion about `€` or about which locale groups with a space.
 */
import { Brand, Data, Order as Ord, Result } from "effect"

export type Money = Brand.Branded<number, "Money">

export class InvalidMoney extends Data.TaggedError("InvalidMoney")<{
  readonly value: number
  readonly reason: "fractional-cent" | "not-finite" | "out-of-range"
}> {}

/**
 * `-0` is invisible in arithmetic but visible to `Object.is`, and so to
 * snapshots and `toStrictEqual`. There is one zero amount.
 */
const withoutNegativeZero = (cents: number): number => (cents === 0 ? 0 : cents)

/** A fraction of a cent is a bug at the call site, not something to round away. */
export const fromCents = (cents: number): Result.Result<Money, InvalidMoney> => {
  if (!Number.isFinite(cents)) {
    return Result.fail(new InvalidMoney({ value: cents, reason: "not-finite" }))
  }
  if (!Number.isInteger(cents)) {
    return Result.fail(new InvalidMoney({ value: cents, reason: "fractional-cent" }))
  }
  if (!Number.isSafeInteger(cents)) {
    return Result.fail(new InvalidMoney({ value: cents, reason: "out-of-range" }))
  }
  return Result.succeed(cents as Money)
}

export const fromEuros = (euros: number): Result.Result<Money, InvalidMoney> => {
  if (!Number.isFinite(euros)) {
    return Result.fail(new InvalidMoney({ value: euros, reason: "not-finite" }))
  }
  if (Math.abs(euros) >= 1e15) {
    return Result.fail(new InvalidMoney({ value: euros, reason: "out-of-range" }))
  }
  if (Number(euros.toFixed(2)) !== euros) {
    return Result.fail(new InvalidMoney({ value: euros, reason: "fractional-cent" }))
  }
  return fromCents(Math.round(euros * 100))
}

export const zero: Money = 0 as Money

export const toCents = (money: Money): number => money

/** Reintroduces floating point. For charts and form fields — never fed back in. */
export const toEuros = (money: Money): number => money / 100

export const add = (a: Money, b: Money): Money => (a + b) as Money

export const subtract = (a: Money, b: Money): Money => (a - b) as Money

export const negate = (money: Money): Money => withoutNegativeZero(-money) as Money

export const abs = (money: Money): Money => Math.abs(money) as Money

export const sum = (amounts: Iterable<Money>): Money => {
  let total = 0
  for (const amount of amounts) total += amount
  return total as Money
}

export const multiply = (money: Money, factor: number): Money => {
  const scaled = money * factor
  const rounded = scaled < 0 ? -Math.round(-scaled) : Math.round(scaled)
  return withoutNegativeZero(rounded) as Money
}

export const Order: Ord.Order<Money> = Ord.Number as Ord.Order<Money>

export const equals = (a: Money, b: Money): boolean => a === b

export const isLessThan = Ord.isLessThan(Order)
export const isLessThanOrEqualTo = Ord.isLessThanOrEqualTo(Order)
export const isGreaterThan = Ord.isGreaterThan(Order)
export const isGreaterThanOrEqualTo = Ord.isGreaterThanOrEqualTo(Order)

export const min = Ord.min(Order)
export const max = Ord.max(Order)
export const clamp = Ord.clamp(Order)

export const isZero = (money: Money): boolean => money === 0
export const isPositive = (money: Money): boolean => money > 0
export const isNegative = (money: Money): boolean => money < 0
