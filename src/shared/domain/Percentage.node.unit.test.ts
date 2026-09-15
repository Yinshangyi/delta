import { Result } from "effect"
import * as fc from "fast-check"
import { describe, expect, it } from "vitest"

import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"

const percent = (value: number): Percentage.Percentage =>
  Result.getOrThrow(Percentage.fromPercent(value))

const euros = (value: number): Money.Money => Result.getOrThrow(Money.fromEuros(value))

const failure = <A, E>(result: Result.Result<A, E>): E => Result.getOrThrow(Result.flip(result))

const anyPercentage = fc.integer({ min: 0, max: 10_000 }).map((bp) => bp as Percentage.Percentage)

const anyMoney = fc
  .integer({ min: -100_000_000, max: 100_000_000 })
  .map((c) => Result.getOrThrow(Money.fromCents(c)))

describe("construction", () => {
  it("accepts a percentage", () => {
    expect(Percentage.toBasisPoints(percent(80))).toBe(8_000)
    expect(Percentage.toBasisPoints(percent(0))).toBe(0)
    expect(Percentage.toBasisPoints(percent(100))).toBe(10_000)
    expect(Percentage.toBasisPoints(percent(2.15))).toBe(215)
  })

  it("accepts a ratio", () => {
    expect(Percentage.toBasisPoints(Result.getOrThrow(Percentage.fromRatio(0.8)))).toBe(8_000)
    expect(Percentage.toBasisPoints(Result.getOrThrow(Percentage.fromRatio(0.07)))).toBe(700)
    expect(Percentage.toBasisPoints(Result.getOrThrow(Percentage.fromRatio(1)))).toBe(10_000)
  })

  it("rejects values outside 0% to 100%", () => {
    expect(failure(Percentage.fromPercent(-1)).reason).toBe("out-of-range")
    expect(failure(Percentage.fromPercent(101)).reason).toBe("out-of-range")
    expect(failure(Percentage.fromRatio(1.5)).reason).toBe("out-of-range")
    expect(failure(Percentage.fromRatio(-0.1)).reason).toBe("out-of-range")
  })

  it("rejects precision finer than a basis point", () => {
    expect(failure(Percentage.fromPercent(80.005)).reason).toBe("sub-basis-point")
    expect(failure(Percentage.fromRatio(0.80005)).reason).toBe("sub-basis-point")
  })

  it("rejects values that are not finite", () => {
    expect(failure(Percentage.fromPercent(Number.NaN)).reason).toBe("not-finite")
    expect(failure(Percentage.fromRatio(Number.POSITIVE_INFINITY)).reason).toBe("not-finite")
  })

  it("agrees between the two constructors", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), (basisPoints) => {
        const viaPercent = Result.getOrThrow(Percentage.fromPercent(basisPoints / 100))
        const viaRatio = Result.getOrThrow(Percentage.fromRatio(basisPoints / 10_000))
        expect(viaPercent).toBe(viaRatio)
        expect(Percentage.toBasisPoints(viaPercent)).toBe(basisPoints)
      })
    )
  })
})

describe("conversion", () => {
  it("reads back as percent and ratio", () => {
    expect(Percentage.toPercent(percent(80))).toBe(80)
    expect(Percentage.toRatio(percent(80))).toBe(0.8)
    expect(Percentage.toPercent(percent(2.15))).toBe(2.15)
  })

  it("names the two endpoints", () => {
    expect(Percentage.toPercent(Percentage.zero)).toBe(0)
    expect(Percentage.toPercent(Percentage.whole)).toBe(100)
  })
})

describe("applyTo", () => {
  it("computes the payout ratio of spec §9 exactly", () => {
    // €600 x 20 days = €12,000 HT; at 80% that is €9,600.
    expect(Percentage.applyTo(euros(12_000), percent(80))).toBe(Money.toCents(euros(9_600)))
  })

  it("is the identity at 100% and zero at 0%", () => {
    expect(Percentage.applyTo(euros(1_234.56), Percentage.whole)).toBe(
      Money.toCents(euros(1_234.56))
    )
    expect(Percentage.applyTo(euros(1_234.56), Percentage.zero)).toBe(0)
  })

  it("rounds half away from zero", () => {
    // 5 cents at 50% is 2.5 cents.
    expect(Percentage.applyTo(Result.getOrThrow(Money.fromCents(5)), percent(50))).toBe(3)
    expect(Percentage.applyTo(Result.getOrThrow(Money.fromCents(-5)), percent(50))).toBe(-3)
  })

  it("has one zero, never a negative one", () => {
    expect(
      Object.is(Percentage.applyTo(Result.getOrThrow(Money.fromCents(-1)), percent(10)), 0)
    ).toBe(true)
  })

  it("handles a rate that is not a round percentage", () => {
    // €10,000 at 2.15%.
    expect(Percentage.applyTo(euros(10_000), percent(2.15))).toBe(21_500)
  })

  it("always yields a whole number of cents", () => {
    fc.assert(
      fc.property(anyMoney, anyPercentage, (money, percentage) => {
        expect(Number.isInteger(Percentage.applyTo(money, percentage))).toBe(true)
      })
    )
  })

  it("never exceeds the original amount", () => {
    fc.assert(
      fc.property(anyMoney, anyPercentage, (money, percentage) => {
        expect(Math.abs(Percentage.applyTo(money, percentage))).toBeLessThanOrEqual(Math.abs(money))
      })
    )
  })

  it("is deterministic", () => {
    fc.assert(
      fc.property(anyMoney, anyPercentage, (money, percentage) => {
        expect(Percentage.applyTo(money, percentage)).toBe(Percentage.applyTo(money, percentage))
      })
    )
  })
})

describe("comparison", () => {
  it("orders proportions", () => {
    expect(Percentage.isLessThan(percent(20), percent(80))).toBe(true)
    expect(Percentage.isGreaterThan(percent(80), percent(20))).toBe(true)
    expect(Percentage.equals(percent(80), percent(80))).toBe(true)
    expect(Percentage.min(percent(80), percent(20))).toBe(2_000)
    expect(Percentage.max(percent(80), percent(20))).toBe(8_000)
  })
})
