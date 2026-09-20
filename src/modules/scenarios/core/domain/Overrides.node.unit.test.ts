import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { BankAccount, holdingId } from "@/modules/capital/core/domain/Holding"
import { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"
import { Valuation } from "@/modules/capital/core/domain/Valuation"
import { commitmentId, RecurringExpense } from "@/modules/commitments/core/domain/Commitment"
import { householdId, personId } from "@/modules/household/core/domain/Household"
import {
  ActivePeriod,
  BillableDaysPlan,
  FreelanceIncome,
  incomeSourceId,
  SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import { brokenReferences, isBroken } from "@/modules/scenarios/core/domain/BrokenReferences"
import { overriddenCommitments } from "@/modules/scenarios/core/domain/OverrideCommitments"
import { overriddenHoldings } from "@/modules/scenarios/core/domain/OverrideHoldings"
import { overriddenIncome } from "@/modules/scenarios/core/domain/OverrideIncome"
import {
  AddHypotheticalExpense,
  ChangeBillableDays,
  ChangeDailyRate,
  ChangeHoldingValue,
  ChangeIncome,
  DisableCommitment,
  ExcludeHolding,
  overrideId,
  Scenario,
  scenarioId
} from "@/modules/scenarios/core/domain/Scenario"
import * as ActivePeriodShared from "@/shared/domain/ActivePeriod"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const days = (count: number) => Result.getOrThrow(BillableDays.fromNumber(count))
const home = householdId("h1")

const freelance = () =>
  new FreelanceIncome({
    id: incomeSourceId("f1"),
    personId: personId("p1"),
    name: "Consulting",
    dailyRate: Result.getOrThrow(DailyRate.fromEuros(600)),
    estimatedPayoutRatio: Result.getOrThrow(PayoutRatio.fromPercent(80)),
    billableDays: new BillableDaysPlan({ standard: days(20), overrides: new Map() }),
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true
  })

const salary = () =>
  new SalaryIncome({
    id: incomeSourceId("s1"),
    personId: personId("p2"),
    name: "Employment",
    monthlyNetBeforeTax: euros(3_000),
    monthlyIncomeTax: euros(300),
    annualGross: undefined,
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true
  })

const rent = () =>
  new RecurringExpense({
    id: commitmentId("r1"),
    householdId: home,
    name: "Rent",
    amount: euros(1_280),
    period: Result.getOrThrow(ActivePeriodShared.make(date("2026-01-01"), undefined)),
    enabled: true
  })

const account = () =>
  new ValuedHolding({
    holding: new BankAccount({
      id: holdingId("a1"),
      householdId: home,
      name: "Joint current account",
      institution: undefined,
      includedInCapital: true,
      enabled: true
    }),
    valuation: new Valuation({ amount: euros(24_000), asOf: date("2026-09-30"), basis: "actual" })
  })

describe("overriding income", () => {
  it("changes the daily rate of the source it names, and nothing else", () => {
    const sources = overriddenIncome(
      [freelance(), salary()],
      [
        new ChangeDailyRate({
          id: overrideId("o1"),
          incomeSourceId: incomeSourceId("f1"),
          dailyRate: Result.getOrThrow(DailyRate.fromEuros(700))
        })
      ]
    )

    expect(Money.toEuros(DailyRate.toMoney((sources[0] as FreelanceIncome).dailyRate))).toBe(700)
    expect((sources[1] as SalaryIncome).monthlyNetBeforeTax).toBe(euros(3_000))
  })

  it("leaves the stored source untouched (SCN-03)", () => {
    const original = freelance()
    overriddenIncome(
      [original],
      [
        new ChangeDailyRate({
          id: overrideId("o1"),
          incomeSourceId: incomeSourceId("f1"),
          dailyRate: Result.getOrThrow(DailyRate.fromEuros(700))
        })
      ]
    )

    expect(Money.toEuros(DailyRate.toMoney(original.dailyRate))).toBe(600)
  })

  it("ignores a freelance change aimed at a salary", () => {
    const sources = overriddenIncome(
      [salary()],
      [
        new ChangeDailyRate({
          id: overrideId("o1"),
          incomeSourceId: incomeSourceId("s1"),
          dailyRate: Result.getOrThrow(DailyRate.fromEuros(700))
        })
      ]
    )

    expect(sources[0]).toStrictEqual(salary())
  })

  it("changes billable days while keeping the month overrides", () => {
    const withOverrides = new FreelanceIncome({
      ...freelance(),
      billableDays: new BillableDaysPlan({
        standard: days(20),
        overrides: new Map([
          [Result.getOrThrow(LocalDate.parse("2026-08-01")).slice(0, 7) as never, days(12)]
        ])
      })
    })

    const sources = overriddenIncome(
      [withOverrides],
      [
        new ChangeBillableDays({
          id: overrideId("o1"),
          incomeSourceId: incomeSourceId("f1"),
          standard: days(16)
        })
      ]
    )

    const plan = (sources[0] as FreelanceIncome).billableDays
    expect(BillableDays.toNumber(plan.standard)).toBe(16)
    expect(plan.overrides.size).toBe(1)
  })

  it("changes a salary's monthly net", () => {
    const sources = overriddenIncome(
      [salary()],
      [
        new ChangeIncome({
          id: overrideId("o1"),
          incomeSourceId: incomeSourceId("s1"),
          monthlyNetBeforeTax: euros(3_600)
        })
      ]
    )

    expect((sources[0] as SalaryIncome).monthlyNetBeforeTax).toBe(euros(3_600))
  })

  it("applies changes in order, so a later one wins", () => {
    const sources = overriddenIncome(
      [freelance()],
      [
        new ChangeDailyRate({
          id: overrideId("o1"),
          incomeSourceId: incomeSourceId("f1"),
          dailyRate: Result.getOrThrow(DailyRate.fromEuros(700))
        }),
        new ChangeDailyRate({
          id: overrideId("o2"),
          incomeSourceId: incomeSourceId("f1"),
          dailyRate: Result.getOrThrow(DailyRate.fromEuros(650))
        })
      ]
    )

    expect(Money.toEuros(DailyRate.toMoney((sources[0] as FreelanceIncome).dailyRate))).toBe(650)
  })
})

describe("overriding commitments", () => {
  it("disables the one it names without deleting it", () => {
    const commitments = overriddenCommitments(
      [rent()],
      [new DisableCommitment({ id: overrideId("o1"), commitmentId: commitmentId("r1") })],
      home
    )

    expect(commitments).toHaveLength(1)
    expect(commitments[0]?.enabled).toBe(false)
  })

  it("leaves the stored commitment untouched", () => {
    const original = rent()
    overriddenCommitments(
      [original],
      [new DisableCommitment({ id: overrideId("o1"), commitmentId: commitmentId("r1") })],
      home
    )

    expect(original.enabled).toBe(true)
  })

  it("adds a hypothetical purchase as an ordinary one-off (spec §34)", () => {
    const commitments = overriddenCommitments(
      [rent()],
      [
        new AddHypotheticalExpense({
          id: overrideId("o1"),
          name: "Holiday",
          amount: euros(11_500),
          date: date("2026-12-04")
        })
      ],
      home
    )

    expect(commitments).toHaveLength(2)
    expect(commitments[1]?.name).toBe("Holiday")
    expect(commitments[1]?.id).toBe("o1")
  })
})

describe("overriding holdings", () => {
  it("excludes the one it names, leaving its value in place", () => {
    const holdings = overriddenHoldings(
      [account()],
      [new ExcludeHolding({ id: overrideId("o1"), holdingId: holdingId("a1") })]
    )

    expect(holdings[0]?.holding.includedInCapital).toBe(false)
    expect(holdings[0]?.valuation?.amount).toBe(euros(24_000))
  })

  it("changes a holding's value without touching its inclusion", () => {
    const holdings = overriddenHoldings(
      [account()],
      [
        new ChangeHoldingValue({
          id: overrideId("o1"),
          holdingId: holdingId("a1"),
          amount: euros(6_500)
        })
      ]
    )

    expect(holdings[0]?.valuation?.amount).toBe(euros(6_500))
    expect(holdings[0]?.holding.includedInCapital).toBe(true)
  })

  it("leaves the stored holding untouched (SCN-04)", () => {
    const original = account()
    overriddenHoldings(
      [original],
      [new ExcludeHolding({ id: overrideId("o1"), holdingId: holdingId("a1") })]
    )

    expect(original.holding.includedInCapital).toBe(true)
  })
})

describe("a scenario pointing at something deleted", () => {
  const scenario = (overrides: Parameters<typeof Scenario>[0]["overrides"]) =>
    new Scenario({ id: scenarioId("sc1"), householdId: home, name: "What if", overrides })

  const live = {
    incomeSources: [incomeSourceId("f1")],
    commitments: [commitmentId("r1")],
    holdings: [holdingId("a1")]
  }

  it("names the override that broke, not just the scenario (SCN-10)", () => {
    const broken = brokenReferences(
      scenario([
        new ChangeDailyRate({
          id: overrideId("o1"),
          incomeSourceId: incomeSourceId("gone"),
          dailyRate: Result.getOrThrow(DailyRate.fromEuros(700))
        })
      ]),
      live
    )

    expect(broken).toHaveLength(1)
    expect(broken[0]?.override).toBe("o1")
    expect(broken[0]?.missing).toBe("income source")
    expect(broken[0]?.kind).toBe("ChangeDailyRate")
  })

  it("is not broken while everything it names still exists", () => {
    const intact = scenario([
      new DisableCommitment({ id: overrideId("o1"), commitmentId: commitmentId("r1") }),
      new ExcludeHolding({ id: overrideId("o2"), holdingId: holdingId("a1") })
    ])

    expect(isBroken(intact, live)).toBe(false)
  })

  it("catches a deleted commitment and a deleted holding alike", () => {
    const broken = brokenReferences(
      scenario([
        new DisableCommitment({ id: overrideId("o1"), commitmentId: commitmentId("gone") }),
        new ExcludeHolding({ id: overrideId("o2"), holdingId: holdingId("gone") })
      ]),
      live
    )

    expect(broken.map((each) => each.missing)).toStrictEqual(["commitment", "holding"])
  })

  it("never breaks on a hypothetical purchase, which points at nothing", () => {
    const withPurchase = scenario([
      new AddHypotheticalExpense({
        id: overrideId("o1"),
        name: "Holiday",
        amount: euros(11_500),
        date: date("2026-12-04")
      })
    ])

    expect(isBroken(withPurchase, live)).toBe(false)
  })
})
