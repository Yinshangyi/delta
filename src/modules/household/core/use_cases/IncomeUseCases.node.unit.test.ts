import { Effect, Result } from "effect"
import { describe, expect, it } from "vitest"

import { personId } from "@/modules/household/core/domain/Household"
import {
  ActivePeriod,
  BillableDaysPlan,
  daysIn,
  FreelanceIncome,
  incomeSourceId,
  isOverridden
} from "@/modules/household/core/domain/IncomeSource"
import { addFreelanceIncome } from "@/modules/household/core/use_cases/AddFreelanceIncomeUseCase"
import { addSalaryIncome } from "@/modules/household/core/use_cases/AddSalaryIncomeUseCase"
import { setBillableDaysOverride } from "@/modules/household/core/use_cases/SetBillableDaysOverrideUseCase"
import { setIncomeSourceEnabled } from "@/modules/household/core/use_cases/SetIncomeSourceEnabledUseCase"
import { makeIncomeSourcesStub } from "@/modules/household/secondary_adapters/IncomeSourcesStub"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { IncomeSource } from "@/modules/household/core/domain/IncomeSource"
import type { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"

const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const days = (count: number) => Result.getOrThrow(BillableDays.fromNumber(count))

const withStub = <A, E>(
  sources: ReadonlyArray<IncomeSource>,
  use: (
    stub: ReturnType<typeof makeIncomeSourcesStub>
  ) => Effect.Effect<A, E, typeof IncomeSources.Identifier>
): Promise<A> => {
  const stub = makeIncomeSourcesStub({ sources })
  return Effect.runPromise(Effect.provide(use(stub), stub.layer))
}

const freelanceDraft = () => ({
  personId: personId("p1"),
  name: "Consulting",
  dailyRateEuros: 600,
  estimatedPayoutPercent: 80,
  standardBillableDays: 18,
  overrides: new Map([[ym("2026-08"), 12]]),
  startDate: date("2026-01-01"),
  endDate: undefined
})

const salaryDraft = () => ({
  personId: personId("p2"),
  name: "Employment",
  monthlyNetBeforeTaxEuros: 3200,
  monthlyIncomeTaxEuros: 320,
  annualGrossEuros: 48_000,
  startDate: date("2026-01-01"),
  endDate: undefined
})

const existingFreelance = () =>
  new FreelanceIncome({
    id: incomeSourceId("f1"),
    personId: personId("p1"),
    name: "Consulting",
    dailyRate: Result.getOrThrow(DailyRate.fromEuros(600)),
    estimatedPayoutRatio: Result.getOrThrow(PayoutRatio.fromPercent(80)),
    billableDays: new BillableDaysPlan({ standard: days(18), overrides: new Map() }),
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true
  })

describe("income use cases", () => {
  it("saves a freelance source with every number validated into its domain type", async () => {
    const saved = await withStub([], () => addFreelanceIncome(freelanceDraft()))

    expect(DailyRate.toMoney(saved.dailyRate)).toBe(Result.getOrThrow(Money.fromEuros(600)))
    expect(PayoutRatio.toPercentage(saved.estimatedPayoutRatio)).toBe(8_000)
    expect(BillableDays.toNumber(daysIn(saved.billableDays, ym("2026-08")))).toBe(12)
    expect(saved.enabled).toBe(true)
  })

  it("blocks saving on an invalid rate rather than storing a bad one", async () => {
    const outcome = await withStub([], (stub) =>
      Effect.result(addFreelanceIncome({ ...freelanceDraft(), dailyRateEuros: -1 })).pipe(
        Effect.map((result) => ({ result, saves: stub.inspect().saves }))
      )
    )

    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.saves).toBe(0)
  })

  it("blocks saving on an invalid payout ratio", async () => {
    const outcome = await withStub([], () =>
      Effect.result(addFreelanceIncome({ ...freelanceDraft(), estimatedPayoutPercent: 140 }))
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("refuses a period that ends before it starts", async () => {
    const outcome = await withStub([], () =>
      Effect.result(addFreelanceIncome({ ...freelanceDraft(), endDate: date("2025-06-01") }))
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("refuses a start date the date picker could not have produced", async () => {
    const outcome = await withStub([], () =>
      Effect.result(addFreelanceIncome({ ...freelanceDraft(), startDate: "2026-13-01" }))
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("reads a cleared end date as ongoing rather than as a bad date", async () => {
    const saved = await withStub([], () => addSalaryIncome({ ...salaryDraft(), endDate: "" }))

    expect(saved.period.endDate).toBeUndefined()
  })

  it("keeps annual gross out of the arithmetic, storing it as it was given", async () => {
    const saved = await withStub([], () => addSalaryIncome(salaryDraft()))

    expect(Money.toCents(saved.monthlyNetBeforeTax)).toBe(320_000)
    expect(Money.toCents(saved.monthlyIncomeTax)).toBe(32_000)
    expect(saved.annualGross).toBe(Result.getOrThrow(Money.fromEuros(48_000)))
  })

  it("accepts a salary with no annual gross at all", async () => {
    const saved = await withStub([], () =>
      addSalaryIncome({ ...salaryDraft(), annualGrossEuros: undefined })
    )

    expect(saved.annualGross).toBeUndefined()
  })

  it("disables a source without removing it", async () => {
    const remaining = await withStub([existingFreelance()], (stub) =>
      setIncomeSourceEnabled(incomeSourceId("f1"), false).pipe(
        Effect.map(() => stub.inspect().sources)
      )
    )

    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.enabled).toBe(false)
  })

  it("overrides one month, leaving the others on the standard", async () => {
    const updated = await withStub([existingFreelance()], () =>
      setBillableDaysOverride(existingFreelance(), ym("2026-12"), 10)
    )

    expect(BillableDays.toNumber(daysIn(updated.billableDays, ym("2026-12")))).toBe(10)
    expect(BillableDays.toNumber(daysIn(updated.billableDays, ym("2026-11")))).toBe(18)
    expect(isOverridden(updated.billableDays, ym("2026-12"))).toBe(true)
  })

  it("treats zero billable days as an override, not a missing one", async () => {
    const updated = await withStub([existingFreelance()], () =>
      setBillableDaysOverride(existingFreelance(), ym("2026-08"), 0)
    )

    expect(isOverridden(updated.billableDays, ym("2026-08"))).toBe(true)
    expect(BillableDays.toNumber(daysIn(updated.billableDays, ym("2026-08")))).toBe(0)
  })

  it("clears an override back to following the standard", async () => {
    const overridden = new FreelanceIncome({
      ...existingFreelance(),
      billableDays: new BillableDaysPlan({
        standard: days(18),
        overrides: new Map([[ym("2026-08"), days(12)]])
      })
    })

    const updated = await withStub([overridden], () =>
      setBillableDaysOverride(overridden, ym("2026-08"), undefined)
    )

    expect(isOverridden(updated.billableDays, ym("2026-08"))).toBe(false)
    expect(BillableDays.toNumber(daysIn(updated.billableDays, ym("2026-08")))).toBe(18)
  })
})
