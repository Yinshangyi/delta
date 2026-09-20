import { Effect, Layer, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { name, personId } from "@/modules/household/core/domain/Household"
import {
  ActivePeriod,
  BillableDaysPlan,
  FreelanceIncome,
  incomeSourceId,
  SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { HouseholdConfigurationLive } from "@/modules/household/secondary_adapters/HouseholdConfigurationLive"
import { IncomeSourcesLive } from "@/modules/household/secondary_adapters/IncomeSourcesLive"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as YearMonth from "@/shared/domain/YearMonth"

/** Real SQLite with the real migrations — not a fake (architecture.md, testing). */
const Persistence = Layer.mergeAll(HouseholdConfigurationLive, IncomeSourcesLive).pipe(
  Layer.provideMerge(MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory)))
)

/**
 * A fresh database per test, deliberately not `@effect/vitest`'s `layer()`:
 * that memoises the build across a describe, and two persistence tests sharing
 * rows is exactly the coupling these tests exist to rule out. An in-memory
 * SQLite costs a millisecond to build.
 */
const run = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    typeof HouseholdConfiguration.Identifier | typeof IncomeSources.Identifier
  >
): Promise<A> => Effect.runPromise(Effect.scoped(Effect.provide(effect, Persistence)))

const named = (value: string) => Result.getOrThrow(name(value))
const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const days = (count: number) => Result.getOrThrow(BillableDays.fromNumber(count))

describe("the household", () => {
  it("is absent until first run", async () => {
    await run(
      Effect.gen(function* () {
        const households = yield* HouseholdConfiguration
        expect(Option.isNone(yield* households.current)).toBe(true)
      })
    )
  })

  it("comes into being with a name and one person", async () => {
    await run(
      Effect.gen(function* () {
        const households = yield* HouseholdConfiguration
        const created = yield* households.create(named("Home"), named("Alex"))
        expect(created.members).toHaveLength(1)

        const loaded = yield* households.current
        expect(Option.getOrThrow(loaded).name).toBe("Home")
        expect(Option.getOrThrow(loaded).members[0]?.name).toBe("Alex")
      })
    )
  })
})

describe("people", () => {
  const withHousehold = Effect.gen(function* () {
    const households = yield* HouseholdConfiguration
    return yield* households.create(named("Home"), named("Alex"))
  })

  it("are added, renamed and removed", async () => {
    await run(
      Effect.gen(function* () {
        const households = yield* HouseholdConfiguration
        const home = yield* withHousehold
        const sam = yield* households.addPerson(home.id, named("Sam"))

        yield* households.renamePerson(sam.id, named("Samuel"))
        const renamed = Option.getOrThrow(yield* households.current)
        expect(renamed.members.map((member) => member.name)).toStrictEqual(["Alex", "Samuel"])

        yield* households.removePerson(sam.id)
        const remaining = Option.getOrThrow(yield* households.current)
        expect(remaining.members.map((member) => member.name)).toStrictEqual(["Alex"])
      })
    )
  })

  it("can be any number, never exactly two", async () => {
    await run(
      Effect.gen(function* () {
        const households = yield* HouseholdConfiguration
        const home = yield* withHousehold
        yield* households.addPerson(home.id, named("Sam"))
        yield* households.addPerson(home.id, named("Robin"))
        yield* households.addPerson(home.id, named("Kim"))

        expect(Option.getOrThrow(yield* households.current).members).toHaveLength(4)
      })
    )
  })
})

describe("income sources", () => {
  const person = personId("p1")

  const freelance = new FreelanceIncome({
    id: incomeSourceId("f1"),
    personId: person,
    name: "Freelance",
    dailyRate: Result.getOrThrow(DailyRate.fromEuros(600)),
    estimatedPayoutRatio: PayoutRatio.developmentAssumption,
    billableDays: new BillableDaysPlan({
      standard: days(20),
      overrides: new Map([
        [ym("2026-08"), days(12)],
        [ym("2026-12"), days(10)]
      ])
    }),
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: undefined }),
    enabled: true
  })

  const salary = new SalaryIncome({
    id: incomeSourceId("s1"),
    personId: person,
    name: "Salary",
    monthlyNetBeforeTax: euros(3_400),
    monthlyIncomeTax: euros(300),
    annualGross: euros(52_000),
    period: new ActivePeriod({ startDate: date("2026-01-01"), endDate: date("2027-06-30") }),
    enabled: false
  })

  it("round-trip a freelance source, overrides included", async () => {
    await run(
      Effect.gen(function* () {
        const sources = yield* IncomeSources
        yield* sources.save(freelance)
        const [loaded] = yield* sources.all

        expect(loaded).toStrictEqual(freelance)
      })
    )
  })

  it("round-trip a salary source, including an absent end date and the gross", async () => {
    await run(
      Effect.gen(function* () {
        const sources = yield* IncomeSources
        yield* sources.save(salary)
        const [loaded] = yield* sources.all

        expect(loaded).toStrictEqual(salary)
      })
    )
  })

  it("keep both variants side by side", async () => {
    await run(
      Effect.gen(function* () {
        const sources = yield* IncomeSources
        yield* sources.save(freelance)
        yield* sources.save(salary)

        const kinds = (yield* sources.all).map((source) => source._tag)
        expect(kinds).toStrictEqual(["FreelanceIncome", "SalaryIncome"])
      })
    )
  })

  it("toggle enabled without touching anything else", async () => {
    await run(
      Effect.gen(function* () {
        const sources = yield* IncomeSources
        yield* sources.save(freelance)
        yield* sources.setEnabled(freelance.id, false)

        const [loaded] = yield* sources.all
        expect(loaded?.enabled).toBe(false)
        expect(loaded).toStrictEqual(new FreelanceIncome({ ...freelance, enabled: false }))
      })
    )
  })

  it("replace an override set rather than accumulating one", async () => {
    await run(
      Effect.gen(function* () {
        const sources = yield* IncomeSources
        yield* sources.save(freelance)
        yield* sources.save(
          new FreelanceIncome({
            ...freelance,
            billableDays: new BillableDaysPlan({ standard: days(20), overrides: new Map() })
          })
        )

        const [loaded] = yield* sources.all
        expect(loaded).toStrictEqual(
          new FreelanceIncome({
            ...freelance,
            billableDays: new BillableDaysPlan({ standard: days(20), overrides: new Map() })
          })
        )
      })
    )
  })

  it("are removed", async () => {
    await run(
      Effect.gen(function* () {
        const sources = yield* IncomeSources
        yield* sources.save(freelance)
        yield* sources.remove(freelance.id)
        expect(yield* sources.all).toStrictEqual([])
      })
    )
  })
})
