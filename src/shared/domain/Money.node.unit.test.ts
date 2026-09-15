import { Result } from "effect"
import * as fc from "fast-check"
import { describe, expect, it } from "vitest"

import * as Money from "@/shared/domain/Money"

/** A failure here is a broken fixture, not a domain outcome. */
const cents = (value: number): Money.Money => Result.getOrThrow(Money.fromCents(value))

const failure = <A, E>(result: Result.Result<A, E>): E => Result.getOrThrow(Result.flip(result))

const anyMoney = fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }).map(cents)

describe("fromCents", () => {
  it("accepts an integer number of cents", () => {
    expect(Money.fromCents(60_000)).toStrictEqual(Result.succeed(60_000))
  })

  it("rejects a fractional cent rather than rounding it away", () => {
    expect(failure(Money.fromCents(10.5)).reason).toBe("fractional-cent")
  })

  it("rejects values that are not finite", () => {
    expect(failure(Money.fromCents(Number.NaN)).reason).toBe("not-finite")
    expect(failure(Money.fromCents(Number.POSITIVE_INFINITY)).reason).toBe("not-finite")
  })

  it("rejects values beyond exact integer representation", () => {
    expect(failure(Money.fromCents(Number.MAX_SAFE_INTEGER + 2)).reason).toBe("out-of-range")
  })

  it("carries the offending value on the error", () => {
    expect(failure(Money.fromCents(10.5)).value).toBe(10.5)
  })
})

describe("fromEuros", () => {
  it("round-trips €600.00 as 60_000 cents", () => {
    expect(Money.toCents(Result.getOrThrow(Money.fromEuros(600)))).toBe(60_000)
    expect(Money.toEuros(cents(60_000))).toBe(600)
  })

  it("converts amounts whose binary representation is already inexact", () => {
    expect(Money.toCents(Result.getOrThrow(Money.fromEuros(19.99)))).toBe(1_999)
    expect(Money.toCents(Result.getOrThrow(Money.fromEuros(0.1)))).toBe(10)
    expect(Money.toCents(Result.getOrThrow(Money.fromEuros(1234.56)))).toBe(123_456)
  })

  it("handles negative amounts", () => {
    expect(Money.toCents(Result.getOrThrow(Money.fromEuros(-42.5)))).toBe(-4_250)
  })

  it("rejects sub-cent precision instead of silently rounding", () => {
    expect(failure(Money.fromEuros(10.005)).reason).toBe("fractional-cent")
    expect(failure(Money.fromEuros(0.001)).reason).toBe("fractional-cent")
  })

  it("round-trips every two-decimal amount", () => {
    fc.assert(
      fc.property(fc.integer({ min: -100_000_000, max: 100_000_000 }), (rawCents) => {
        const euros = rawCents / 100
        expect(Money.toCents(Result.getOrThrow(Money.fromEuros(euros)))).toBe(rawCents)
      })
    )
  })
})

describe("arithmetic", () => {
  it("adds and subtracts", () => {
    expect(Money.add(cents(60_000), cents(2_550))).toBe(62_550)
    expect(Money.subtract(cents(60_000), cents(2_550))).toBe(57_450)
  })

  it("negates and takes absolute value", () => {
    expect(Money.negate(cents(60_000))).toBe(-60_000)
    expect(Money.abs(cents(-60_000))).toBe(60_000)
  })

  it("has one zero, never a negative one", () => {
    expect(Object.is(Money.negate(Money.zero), 0)).toBe(true)
    expect(Object.is(Money.multiply(cents(-1), 0.1), 0)).toBe(true)
  })

  it("sums an empty iterable to zero", () => {
    expect(Money.sum([])).toBe(Money.zero)
  })

  it("sums many amounts without drift", () => {
    // €0.10 a hundred times is €10.00 exactly — the canonical float failure.
    const tenCents = Array.from({ length: 100 }, () => cents(10))
    expect(Money.sum(tenCents)).toBe(1_000)
  })

  it("addition is associative and commutative", () => {
    fc.assert(
      fc.property(anyMoney, anyMoney, anyMoney, (a, b, c) => {
        expect(Money.add(a, b)).toBe(Money.add(b, a))
        expect(Money.add(Money.add(a, b), c)).toBe(Money.add(a, Money.add(b, c)))
      })
    )
  })

  it("zero is the additive identity and subtraction undoes addition", () => {
    fc.assert(
      fc.property(anyMoney, anyMoney, (a, b) => {
        expect(Money.add(a, Money.zero)).toBe(a)
        expect(Money.subtract(Money.add(a, b), b)).toBe(a)
      })
    )
  })

  it("sum agrees with repeated addition", () => {
    fc.assert(
      fc.property(fc.array(anyMoney, { maxLength: 50 }), (amounts) => {
        expect(Money.sum(amounts)).toBe(amounts.reduce(Money.add, Money.zero))
      })
    )
  })
})

describe("multiply", () => {
  it("scales by a ratio", () => {
    // €10,000 at the 75% payout ratio of spec §9.
    expect(Money.multiply(cents(1_000_000), 0.75)).toBe(750_000)
  })

  it("rounds half away from zero, not toward positive infinity", () => {
    expect(Money.multiply(cents(5), 0.5)).toBe(3)
    expect(Money.multiply(cents(-5), 0.5)).toBe(-3)
  })

  it("rounds down below the halfway point", () => {
    expect(Money.multiply(cents(10), 0.149)).toBe(1)
    expect(Money.multiply(cents(-10), 0.149)).toBe(-1)
  })

  it("is deterministic across repeated application", () => {
    fc.assert(
      fc.property(anyMoney, fc.double({ min: 0, max: 2, noNaN: true }), (amount, factor) => {
        expect(Money.multiply(amount, factor)).toBe(Money.multiply(amount, factor))
      })
    )
  })

  it("negating commutes with scaling", () => {
    fc.assert(
      fc.property(anyMoney, fc.double({ min: 0, max: 2, noNaN: true }), (amount, factor) => {
        expect(Money.multiply(Money.negate(amount), factor)).toBe(
          Money.negate(Money.multiply(amount, factor))
        )
      })
    )
  })

  it("always yields a whole number of cents", () => {
    fc.assert(
      fc.property(anyMoney, fc.double({ min: -5, max: 5, noNaN: true }), (amount, factor) => {
        expect(Number.isInteger(Money.multiply(amount, factor))).toBe(true)
      })
    )
  })
})

describe("comparison", () => {
  it("orders amounts", () => {
    expect(Money.isLessThan(cents(100), cents(200))).toBe(true)
    expect(Money.isGreaterThan(cents(100), cents(200))).toBe(false)
    expect(Money.isGreaterThanOrEqualTo(cents(100), cents(100))).toBe(true)
    expect(Money.isLessThanOrEqualTo(cents(100), cents(100))).toBe(true)
  })

  it("picks the smaller and larger of two amounts", () => {
    expect(Money.min(cents(100), cents(-200))).toBe(-200)
    expect(Money.max(cents(100), cents(-200))).toBe(100)
  })

  it("sorts with the Order instance", () => {
    expect([cents(300), cents(-100), cents(0)].sort(Money.Order)).toStrictEqual([-100, 0, 300])
  })

  it("classifies sign and zero", () => {
    expect(Money.isZero(Money.zero)).toBe(true)
    expect(Money.isPositive(cents(1))).toBe(true)
    expect(Money.isNegative(cents(-1))).toBe(true)
    expect(Money.isPositive(Money.zero)).toBe(false)
    expect(Money.isNegative(Money.zero)).toBe(false)
  })

  it("equals matches the Order instance", () => {
    fc.assert(
      fc.property(anyMoney, anyMoney, (a, b) => {
        expect(Money.equals(a, b)).toBe(Money.Order(a, b) === 0)
      })
    )
  })
})
