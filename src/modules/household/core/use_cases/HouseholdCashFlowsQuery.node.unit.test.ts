import { Effect, Result } from "effect"
import { describe, expect, it } from "vitest"

import { personId } from "@/modules/household/core/domain/Household"
import {
  ActivePeriod,
  BillableDaysPlan,
  FreelanceIncome,
  incomeSourceId,
  SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import { householdCashFlowsBetween } from "@/modules/household/core/use_cases/HouseholdCashFlowsQuery"
import { makeIncomeSourcesStub } from "@/modules/household/secondary_adapters/IncomeSourcesStub"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { IncomeSource } from "@/modules/household/core/domain/IncomeSource"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const days = (count: number) => Result.getOrThrow(BillableDays.fromNumber(count))

const freelance = (overrides: Partial<ConstructorParameters<typeof FreelanceIncome>[0]> = {}) =>
  new FreelanceIncome({
    id: incomeSourceId("f1"),
    personId: personId("p1"),
    name: "Consulting",
    dailyRate: Result.getOrThrow(DailyRate.fromEuros(600)),
    estimatedPayoutRatio: Result.getOrThrow(PayoutRatio.fromPercent(80)),
    billableDays: new BillableDaysPlan({ standard: days(20), overrides: new Map() }),
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true,
    ...overrides
  })

const salary = (overrides: Partial<ConstructorParameters<typeof SalaryIncome>[0]> = {}) =>
  new SalaryIncome({
    id: incomeSourceId("s1"),
    personId: personId("p2"),
    name: "Employment",
    monthlyNetBeforeTax: euros(3_400),
    monthlyIncomeTax: euros(300),
    annualGross: undefined,
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true,
    ...overrides
  })

const between = (sources: ReadonlyArray<IncomeSource>, from: string, to: string) =>
  Effect.runPromise(
    Effect.provide(
      householdCashFlowsBetween(ym(from), ym(to)),
      makeIncomeSourcesStub({ sources }).layer
    )
  )

describe("the household's cash flow seam", () => {
  it("is every person's income together, not one person's", async () => {
    const flows = await between([freelance(), salary()], "2026-01", "2026-01")

    expect(flows.map((flow) => flow.sourceKind).sort()).toStrictEqual(["freelance", "salary"])
    expect(Money.toEuros(Money.sum(flows.map((flow) => flow.amount)))).toBe(9_600 + 3_100)
  })

  it("covers every month of the range asked for, per source", async () => {
    const flows = await between([freelance(), salary()], "2026-01", "2026-03")

    expect(flows).toHaveLength(6)
  })

  it("leaves a disabled source out without leaving a gap", async () => {
    const flows = await between([freelance({ enabled: false }), salary()], "2026-01", "2026-02")

    expect(flows.map((flow) => flow.sourceKind)).toStrictEqual(["salary", "salary"])
  })

  it("is empty when nothing is running in the range, rather than absent", async () => {
    const flows = await between(
      [
        freelance({
          period: new ActivePeriod({ startDate: date("2030-01-01"), endDate: undefined })
        })
      ],
      "2026-01",
      "2026-12"
    )

    expect(flows).toStrictEqual([])
  })

  it("carries each flow's own source, so the table can attribute a month", async () => {
    const flows = await between([freelance(), salary()], "2026-01", "2026-01")

    expect(flows.map((flow) => flow.sourceId).sort()).toStrictEqual(["f1", "s1"])
  })

  it("adds a third source without the query learning what it is", async () => {
    const second = freelance({ id: incomeSourceId("f2"), personId: personId("p3") })
    const flows = await between([freelance(), salary(), second], "2026-01", "2026-01")

    expect(flows).toHaveLength(3)
  })
})
