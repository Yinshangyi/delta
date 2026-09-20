import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { personId } from "@/modules/household/core/domain/Household"
import { cashFlowsFor } from "@/modules/household/core/domain/IncomeCashFlows"
import {
  ActivePeriod,
  BillableDaysPlan,
  FreelanceIncome,
  incomeSourceId,
  SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as YearMonth from "@/shared/domain/YearMonth"

const euros = (value: number): Money.Money => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string): LocalDate.LocalDate => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string): YearMonth.YearMonth => Result.getOrThrow(YearMonth.parse(iso))
const days = (count: number): BillableDays.BillableDays =>
  Result.getOrThrow(BillableDays.fromNumber(count))

const freelance = (overrides: Partial<ConstructorParameters<typeof FreelanceIncome>[0]> = {}) =>
  new FreelanceIncome({
    id: incomeSourceId("f1"),
    personId: personId("p1"),
    name: "Freelance",
    dailyRate: Result.getOrThrow(DailyRate.fromEuros(600)),
    estimatedPayoutRatio: PayoutRatio.developmentAssumption,
    billableDays: new BillableDaysPlan({ standard: days(20), overrides: new Map() }),
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true,
    ...overrides
  })

const salary = (overrides: Partial<ConstructorParameters<typeof SalaryIncome>[0]> = {}) =>
  new SalaryIncome({
    id: incomeSourceId("s1"),
    personId: personId("p2"),
    name: "Salary",
    monthlyNetBeforeTax: euros(3_400),
    monthlyIncomeTax: euros(300),
    annualGross: undefined,
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true,
    ...overrides
  })

describe("freelance revenue", () => {
  it("is rate × days × payout ratio, exactly (spec §9)", () => {
    const [flow] = cashFlowsFor(freelance(), ym("2026-01"), ym("2026-01"))
    // €600 × 20 = €12,000 HT; at 80% that is €9,600.
    expect(flow?.amount).toBe(Money.toCents(euros(9_600)))
  })

  it("lands on the last day of the month, where balances are recorded", () => {
    const [flow] = cashFlowsFor(freelance(), ym("2026-02"), ym("2026-02"))
    expect(flow?.date).toBe("2026-02-28")
  })

  it("uses a per-month override in place of the default", () => {
    const august = ym("2026-08")
    const source = freelance({
      billableDays: new BillableDaysPlan({
        standard: days(20),
        overrides: new Map([[august, days(12)]])
      })
    })
    const [flow] = cashFlowsFor(source, august, august)
    // €600 × 12 = €7,200; at 80% that is €5,760.
    expect(flow?.amount).toBe(Money.toCents(euros(5_760)))
  })

  it("earns nothing in a month billed at zero, which is a real answer", () => {
    const august = ym("2026-08")
    const source = freelance({
      billableDays: new BillableDaysPlan({
        standard: days(20),
        overrides: new Map([[august, days(0)]])
      })
    })
    const [flow] = cashFlowsFor(source, august, august)
    expect(flow?.amount).toBe(0)
  })

  it("is labelled by kind, not by person", () => {
    const [flow] = cashFlowsFor(freelance(), ym("2026-01"), ym("2026-01"))
    expect(flow?.sourceKind).toBe("freelance")
    expect(flow?.sourceId).toBe("f1")
  })
})

describe("salary", () => {
  it("is net before tax minus income tax (spec §12)", () => {
    const [flow] = cashFlowsFor(salary(), ym("2026-01"), ym("2026-01"))
    expect(flow?.amount).toBe(Money.toCents(euros(3_100)))
  })

  it("ignores the informational annual gross entirely", () => {
    const withGross = salary({ annualGross: euros(52_000) })
    const [flow] = cashFlowsFor(withGross, ym("2026-01"), ym("2026-01"))
    expect(flow?.amount).toBe(Money.toCents(euros(3_100)))
  })

  it("produces one flow per active month", () => {
    expect(cashFlowsFor(salary(), ym("2026-01"), ym("2026-06"))).toHaveLength(6)
  })
})

describe("the active period", () => {
  it("produces nothing before the start date", () => {
    const source = salary({
      period: new ActivePeriod({ startDate: date("2026-04-01"), endDate: undefined })
    })
    const months = cashFlowsFor(source, ym("2026-01"), ym("2026-06")).map((flow) => flow.date)
    expect(months).toStrictEqual(["2026-04-30", "2026-05-31", "2026-06-30"])
  })

  it("produces nothing after the end date", () => {
    const source = salary({
      period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: date("2026-03-15") })
    })
    expect(cashFlowsFor(source, ym("2026-01"), ym("2026-06"))).toHaveLength(3)
  })

  it("counts the month a source starts mid-way through", () => {
    const source = salary({
      period: new ActivePeriod({ startDate: date("2026-04-20"), endDate: undefined })
    })
    expect(cashFlowsFor(source, ym("2026-04"), ym("2026-04"))).toHaveLength(1)
  })

  it("runs on indefinitely when there is no end date, bounded by the horizon asked for", () => {
    expect(cashFlowsFor(salary(), ym("2026-01"), ym("2055-12"))).toHaveLength(30 * 12)
  })
})

describe("a disabled source", () => {
  it("produces nothing at all", () => {
    expect(cashFlowsFor(freelance({ enabled: false }), ym("2026-01"), ym("2026-12"))).toStrictEqual(
      []
    )
    expect(cashFlowsFor(salary({ enabled: false }), ym("2026-01"), ym("2026-12"))).toStrictEqual([])
  })
})
