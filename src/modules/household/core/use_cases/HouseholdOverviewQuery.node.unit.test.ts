import { Effect, Layer, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import {
  Household,
  householdId,
  name,
  Person,
  personId
} from "@/modules/household/core/domain/Household"
import {
  ActivePeriod,
  BillableDaysPlan,
  FreelanceIncome,
  incomeSourceId
} from "@/modules/household/core/domain/IncomeSource"
import { householdOverview } from "@/modules/household/core/use_cases/HouseholdOverviewQuery"
import { makeHouseholdConfigurationStub } from "@/modules/household/secondary_adapters/HouseholdConfigurationStub"
import { makeIncomeSourcesStub } from "@/modules/household/secondary_adapters/IncomeSourcesStub"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"

import type { IncomeSource } from "@/modules/household/core/domain/IncomeSource"

const named = (value: string) => Result.getOrThrow(name(value))

const household = () => {
  const id = householdId("h1")
  return new Household({
    id,
    name: named("Home"),
    members: [
      new Person({ id: personId("p1"), householdId: id, name: named("Ada") }),
      new Person({ id: personId("p2"), householdId: id, name: named("Lin") })
    ]
  })
}

const consulting = () =>
  new FreelanceIncome({
    id: incomeSourceId("f1"),
    personId: personId("p1"),
    name: "Consulting",
    dailyRate: Result.getOrThrow(DailyRate.fromEuros(600)),
    estimatedPayoutRatio: Result.getOrThrow(PayoutRatio.fromPercent(80)),
    billableDays: new BillableDaysPlan({
      standard: Result.getOrThrow(BillableDays.fromNumber(18)),
      overrides: new Map()
    }),
    period: new ActivePeriod({
      startDate: Result.getOrThrow(LocalDate.parse("2026-01-01")),
      endDate: undefined
    }),
    enabled: true
  })

const run = (existing: Household | undefined, sources: ReadonlyArray<IncomeSource>) =>
  Effect.runPromise(
    Effect.provide(
      householdOverview,
      Layer.mergeAll(
        makeHouseholdConfigurationStub({ existing }).layer,
        makeIncomeSourcesStub({ sources }).layer
      )
    )
  )

describe("household overview", () => {
  it("is absent before setup, which is what sends the shell to onboarding", async () => {
    expect(Option.isNone(await run(undefined, []))).toBe(true)
  })

  it("attaches each source to its owner", async () => {
    const overview = Option.getOrThrow(await run(household(), [consulting()]))

    expect(overview.members.map((member) => member.sources.length)).toStrictEqual([1, 0])
    expect(overview.members[0]?.sources[0]?.name).toBe("Consulting")
  })

  it("keeps a member with no income, who is still part of the household", async () => {
    const overview = Option.getOrThrow(await run(household(), []))

    expect(overview.members).toHaveLength(2)
    expect(overview.household.name).toBe("Home")
  })
})
