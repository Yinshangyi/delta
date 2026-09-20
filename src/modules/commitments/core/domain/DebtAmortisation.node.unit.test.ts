import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { commitmentId, Debt } from "@/modules/commitments/core/domain/Commitment"
import {
  instalments,
  nextBalance,
  paymentFor,
  progressOf
} from "@/modules/commitments/core/domain/DebtAmortisation"
import { householdId } from "@/modules/household/core/domain/Household"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"
import * as YearMonth from "@/shared/domain/YearMonth"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))

const debt = (overrides: Partial<ConstructorParameters<typeof Debt>[0]> = {}) =>
  new Debt({
    id: commitmentId("d1"),
    householdId: householdId("h1"),
    name: "Card debt",
    initialAmount: euros(11_000),
    interestRate: Percentage.zero,
    regularPaymentAmount: euros(900),
    startDate: date("2026-01-01"),
    enabled: true,
    ...overrides
  })

/** Spec §58 names these two as required. They are written first for that reason. */
describe("the two cases spec §58 requires", () => {
  it("pays €400 when €400 is left, not the normal €900", () => {
    expect(paymentFor(euros(400), euros(900))).toBe(euros(400))
  })

  it("produces nothing at all once the balance reaches zero", () => {
    expect(instalments(debt(), Money.zero, ym("2026-01"), ym("2026-12"))).toStrictEqual([])
  })
})

describe("repayment arithmetic", () => {
  it("is max(0, current − payment)", () => {
    expect(nextBalance(euros(1_000), euros(900))).toBe(euros(100))
    expect(nextBalance(euros(400), euros(900))).toBe(Money.zero)
  })

  it("never goes negative, however large the payment", () => {
    expect(Money.isNegative(nextBalance(euros(1), euros(10_000)))).toBe(false)
  })

  it("ends on the exact remainder rather than overpaying", () => {
    const schedule = instalments(debt(), euros(2_200), ym("2026-01"), ym("2026-12"))

    expect(schedule.map((each) => Money.toEuros(each.payment))).toStrictEqual([900, 900, 400])
    expect(schedule.map((each) => Money.toEuros(each.remainingAfter))).toStrictEqual([
      1_300, 400, 0
    ])
  })

  it("stops the month the debt clears, not at the end of the range", () => {
    const schedule = instalments(debt(), euros(1_800), ym("2026-01"), ym("2030-12"))

    expect(schedule.map((each) => YearMonth.toIso(each.month))).toStrictEqual([
      "2026-01",
      "2026-02"
    ])
  })

  it("is bounded by the range asked for when the debt outlives it", () => {
    expect(instalments(debt(), euros(11_000), ym("2026-01"), ym("2026-03"))).toHaveLength(3)
  })

  it("yields nothing for a payment of zero rather than an endless schedule", () => {
    const never = debt({ regularPaymentAmount: Money.zero })

    expect(instalments(never, euros(11_000), ym("2026-01"), ym("2099-12"))).toStrictEqual([])
  })
})

describe("what the debt panel shows (spec §23)", () => {
  it("reports the repaid share of the initial amount", () => {
    const progress = progressOf(debt(), euros(7_200), ym("2027-01"))

    expect(Money.toEuros(progress.repaid)).toBe(3_800)
    expect(progress.percentRepaid).toBe(35)
  })

  it("counts the payments left, rounding the part-payment up to a whole one", () => {
    const progress = progressOf(debt(), euros(7_200), ym("2027-01"))

    expect(progress.paymentsRemaining).toBe(8)
  })

  it("dates the payoff from the next payment, not from today", () => {
    const progress = progressOf(debt(), euros(7_200), ym("2027-01"))

    expect(progress.payoffMonth).toBe(ym("2027-08"))
  })

  it("reports a cleared debt as fully repaid with nothing left to pay", () => {
    const progress = progressOf(debt(), Money.zero, ym("2027-01"))

    expect(progress.percentRepaid).toBe(100)
    expect(progress.paymentsRemaining).toBe(0)
    expect(progress.payoffMonth).toBeUndefined()
  })

  it("gives no payoff date when the payment could never clear it", () => {
    const progress = progressOf(
      debt({ regularPaymentAmount: Money.zero }),
      euros(7_200),
      ym("2027-01")
    )

    expect(progress.paymentsRemaining).toBeUndefined()
    expect(progress.payoffMonth).toBeUndefined()
  })
})
