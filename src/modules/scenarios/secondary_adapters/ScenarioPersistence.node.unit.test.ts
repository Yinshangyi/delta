import { Effect, Layer, Result } from "effect"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { holdingId } from "@/modules/capital/core/domain/Holding"
import { commitmentId } from "@/modules/commitments/core/domain/Commitment"
import { name } from "@/modules/household/core/domain/Household"
import { incomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { HouseholdConfigurationLive } from "@/modules/household/secondary_adapters/HouseholdConfigurationLive"
import {
  AddHypotheticalExpense,
  ChangeBillableDays,
  ChangeDailyRate,
  ChangeHoldingValue,
  ChangeIncome,
  ChangePayoutRatio,
  DisableCommitment,
  ExcludeHolding,
  overrideId,
  Scenario,
  scenarioId
} from "@/modules/scenarios/core/domain/Scenario"
import { Scenarios } from "@/modules/scenarios/core/ports/secondary/Scenarios"
import { ScenariosLive } from "@/modules/scenarios/secondary_adapters/ScenariosLive"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"

import type { HouseholdId } from "@/modules/household/core/domain/Household"

const Persistence = Layer.mergeAll(ScenariosLive, HouseholdConfigurationLive).pipe(
  Layer.provideMerge(MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory)))
)

const run = <A, E>(
  effect: Effect.Effect<
    A,
    E,
    typeof Scenarios.Identifier | typeof HouseholdConfiguration.Identifier
  >
): Promise<A> => Effect.runPromise(Effect.scoped(Effect.provide(effect, Persistence)))

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const named = (value: string) => Result.getOrThrow(name(value))

const household = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const created = yield* configuration.create(named("Home"), named("Ada"))
  return created.id
})

/** Every kind, so a missing column shows up as a failed round trip. */
const everyOverride = () => [
  new ChangeDailyRate({
    id: overrideId("o1"),
    incomeSourceId: incomeSourceId("f1"),
    dailyRate: Result.getOrThrow(DailyRate.fromEuros(700))
  }),
  new ChangeBillableDays({
    id: overrideId("o2"),
    incomeSourceId: incomeSourceId("f1"),
    standard: Result.getOrThrow(BillableDays.fromNumber(16))
  }),
  new ChangePayoutRatio({
    id: overrideId("o3"),
    incomeSourceId: incomeSourceId("f1"),
    ratio: Result.getOrThrow(PayoutRatio.fromPercent(75))
  }),
  new ChangeIncome({
    id: overrideId("o4"),
    incomeSourceId: incomeSourceId("s1"),
    monthlyNetBeforeTax: euros(3_600)
  }),
  new AddHypotheticalExpense({
    id: overrideId("o5"),
    name: "Holiday",
    amount: euros(11_500),
    date: date("2027-08-01")
  }),
  new DisableCommitment({ id: overrideId("o6"), commitmentId: commitmentId("r1") }),
  new ExcludeHolding({ id: overrideId("o7"), holdingId: holdingId("a1") }),
  new ChangeHoldingValue({
    id: overrideId("o8"),
    holdingId: holdingId("a1"),
    amount: euros(6_500)
  })
]

const scenario = (owner: HouseholdId) =>
  new Scenario({
    id: scenarioId("sc1"),
    householdId: owner,
    name: "What if the rate rose",
    overrides: everyOverride()
  })

const saveOne = Effect.gen(function* () {
  const owner = yield* household
  const scenarios = yield* Scenarios
  yield* scenarios.save(scenario(owner))
  return { owner, loaded: yield* scenarios.all }
})

describe("scenarios in SQLite", () => {
  it("round-trips every override kind without loss (SCN-02)", async () => {
    const { owner, loaded } = await run(saveOne)

    expect(loaded).toStrictEqual([scenario(owner)])
  })

  it("keeps the overrides in the order they were stacked", async () => {
    const { loaded } = await run(saveOne)

    expect(loaded[0]?.overrides.map((each) => each.id)).toStrictEqual([
      "o1",
      "o2",
      "o3",
      "o4",
      "o5",
      "o6",
      "o7",
      "o8"
    ])
  })

  it("replaces the overrides on save rather than appending", async () => {
    const overrides = await run(
      Effect.gen(function* () {
        const { owner } = yield* saveOne
        const scenarios = yield* Scenarios
        yield* scenarios.save(
          new Scenario({
            ...scenario(owner),
            overrides: [
              new DisableCommitment({ id: overrideId("o6"), commitmentId: commitmentId("r1") })
            ]
          })
        )
        return (yield* scenarios.all).flatMap((each) => each.overrides)
      })
    )

    expect(overrides.map((each) => each.id)).toStrictEqual(["o6"])
  })

  it("stores no computed result anywhere (SCN-02)", async () => {
    const { loaded } = await run(saveOne)

    // The type has nowhere to put one, which is the point: a stale answer has
    // no hiding place.
    expect(loaded.map((each) => Object.keys(each).sort())).toStrictEqual([
      ["householdId", "id", "name", "overrides"]
    ])
  })

  it("is deletable", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        yield* saveOne
        const scenarios = yield* Scenarios
        yield* scenarios.remove(scenarioId("sc1"))
        return yield* scenarios.all
      })
    )

    expect(remaining).toStrictEqual([])
  })

  it("filters by household", async () => {
    const mine = await run(
      Effect.gen(function* () {
        const { owner } = yield* saveOne
        const scenarios = yield* Scenarios
        return yield* scenarios.forHousehold(owner)
      })
    )

    expect(mine).toHaveLength(1)
  })
})
