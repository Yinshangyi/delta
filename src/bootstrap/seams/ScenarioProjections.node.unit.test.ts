import { Effect, Layer, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { scenarioProjectionsLive } from "@/bootstrap/seams/ScenarioProjectionsLive"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import { addHolding } from "@/modules/capital/core/use_cases/AddHoldingUseCase"
import { capitalAdaptersLayer } from "@/modules/capital/Dependencies"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { saveCommitment } from "@/modules/commitments/core/use_cases/SaveCommitmentUseCase"
import { commitmentsAdaptersLayer } from "@/modules/commitments/Dependencies"
import { name } from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { addSalaryIncome } from "@/modules/household/core/use_cases/AddSalaryIncomeUseCase"
import { householdAdaptersLayer } from "@/modules/household/Dependencies"
import {
  AddHypotheticalExpense,
  ChangeIncome,
  DisableCommitment,
  ExcludeHolding,
  overrideId
} from "@/modules/scenarios/core/domain/Scenario"
import { ScenarioProjections } from "@/modules/scenarios/core/ports/secondary/ScenarioProjections"
import { timeCostOfOverrides } from "@/modules/scenarios/core/use_cases/TimeCostQuery"
import { setFinancialGoal } from "@/modules/trajectory/core/use_cases/SetFinancialGoalUseCase"
import { trajectoryAdaptersLayer } from "@/modules/trajectory/Dependencies"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"
import type { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const named = (value: string) => Result.getOrThrow(name(value))

const window = () => ({ from: ym("2026-01"), asOf: date("2026-01-31") })

const persisted = MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))
const modules = Layer.mergeAll(
  householdAdaptersLayer,
  trajectoryAdaptersLayer,
  commitmentsAdaptersLayer,
  capitalAdaptersLayer
).pipe(Layer.provideMerge(persisted))
const AppUnderTest = scenarioProjectionsLive(window()).pipe(Layer.provideMerge(modules))

type Services =
  | typeof HouseholdConfiguration.Identifier
  | typeof IncomeSources.Identifier
  | typeof Goals.Identifier
  | typeof Commitments.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier
  | typeof ScenarioProjections.Identifier

const run = <A, E>(effect: Effect.Effect<A, E, Services>): Promise<A> =>
  Effect.runPromise(Effect.scoped(Effect.provide(effect, AppUnderTest)))

/** €3,000 a month in, €1,000 out, €10,000 saved, €40,000 goal. */
const household: Effect.Effect<HouseholdId, never, Services> = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const created = yield* configuration.create(named("Home"), named("Ada"))

  yield* addSalaryIncome({
    personId: created.members[0]!.id,
    name: "Employment",
    monthlyNetBeforeTaxEuros: 3_000,
    monthlyIncomeTaxEuros: 0,
    annualGrossEuros: undefined,
    startDate: "2026-01-01",
    endDate: undefined
  })

  yield* saveCommitment({
    kind: "RecurringExpense",
    household: created.id,
    name: "Rent",
    amountEuros: 1_000,
    startDate: "2026-01-01",
    endDate: undefined
  })

  yield* addHolding({
    kind: "BankAccount",
    household: created.id,
    name: "Joint current account",
    institution: undefined,
    openingBalanceEuros: 10_000,
    balanceDate: "2026-01-31",
    today: "2026-01-31"
  })

  yield* setFinancialGoal({ household: created.id, name: "Runway", targetEuros: 40_000 })
  return created.id
}).pipe(Effect.orDie)

const monthsUnder = (overrides: ReadonlyArray<ScenarioOverride>) =>
  Effect.gen(function* () {
    const projections = yield* ScenarioProjections
    const projection = Option.getOrThrow(yield* projections.under(overrides))
    return projection.result.months.length
  })

describe("the projection under a scenario", () => {
  it("is the baseline when there are no overrides", async () => {
    const months = await run(household.pipe(Effect.flatMap(() => monthsUnder([]))))

    // €10,000 + €2,000 a month reaches €40,000 in fifteen months.
    expect(months).toBe(15)
  })

  it("honours an income change (spec §34)", async () => {
    const months = await run(
      Effect.gen(function* () {
        yield* household
        const sources = yield* IncomeSources
        const salary = (yield* sources.all)[0]!
        return yield* monthsUnder([
          new ChangeIncome({
            id: overrideId("o1"),
            incomeSourceId: salary.id,
            monthlyNetBeforeTax: euros(4_000)
          })
        ])
      })
    )

    // €3,000 a month of savings instead of €2,000 reaches €40,000 in ten.
    expect(months).toBe(10)
  })

  it("honours a disabled commitment", async () => {
    const months = await run(
      Effect.gen(function* () {
        yield* household
        const commitments = yield* Commitments
        const rent = (yield* commitments.all)[0]!
        return yield* monthsUnder([
          new DisableCommitment({ id: overrideId("o1"), commitmentId: rent.id })
        ])
      })
    )

    expect(months).toBe(10)
  })

  it("honours a hypothetical purchase (spec §36)", async () => {
    const months = await run(
      household.pipe(
        Effect.flatMap(() =>
          monthsUnder([
            new AddHypotheticalExpense({
              id: overrideId("o1"),
              name: "Holiday",
              amount: euros(6_000),
              date: date("2026-03-15")
            })
          ])
        )
      )
    )

    expect(months).toBe(18)
  })

  it("honours an excluded holding (spec §75)", async () => {
    const months = await run(
      Effect.gen(function* () {
        yield* household
        const holdings = yield* Holdings
        const account = (yield* holdings.all)[0]!
        return yield* monthsUnder([
          new ExcludeHolding({ id: overrideId("o1"), holdingId: account.id })
        ])
      })
    )

    // Without the €10,000 opening balance it takes twenty months.
    expect(months).toBe(20)
  })

  it("never writes the overrides into stored configuration (SCN-03, SCN-04)", async () => {
    const stored = await run(
      Effect.gen(function* () {
        yield* household
        const sources = yield* IncomeSources
        const commitments = yield* Commitments
        const holdings = yield* Holdings
        const salary = (yield* sources.all)[0]!

        yield* monthsUnder([
          new ChangeIncome({
            id: overrideId("o1"),
            incomeSourceId: salary.id,
            monthlyNetBeforeTax: euros(4_000)
          }),
          new DisableCommitment({
            id: overrideId("o2"),
            commitmentId: (yield* commitments.all)[0]!.id
          }),
          new ExcludeHolding({ id: overrideId("o3"), holdingId: (yield* holdings.all)[0]!.id })
        ])

        return {
          commitments: (yield* commitments.all).map((each) => each.enabled),
          holdings: (yield* holdings.all).map((each) => each.includedInCapital),
          count: (yield* commitments.all).length
        }
      })
    )

    expect(stored.commitments).toStrictEqual([true])
    expect(stored.holdings).toStrictEqual([true])
    // The hypothetical purchase did not become a real commitment either.
    expect(stored.count).toBe(1)
  })
})

describe("time cost", () => {
  it("is a diff of two projections, never a formula (spec §36)", async () => {
    const cost = await run(
      household.pipe(
        Effect.flatMap(() =>
          timeCostOfOverrides([
            new AddHypotheticalExpense({
              id: overrideId("o1"),
              name: "Holiday",
              amount: euros(6_000),
              date: date("2026-03-15")
            })
          ])
        )
      )
    )

    expect(cost.months).toBe(3)
    expect(YearMonth.toIso(cost.baseline!)).toBe("2027-03")
    expect(YearMonth.toIso(cost.simulated!)).toBe("2027-06")
  })

  it("decomposes a stack, attributing months to each change (SCN-05)", async () => {
    const cost = await run(
      Effect.gen(function* () {
        yield* household
        const sources = yield* IncomeSources
        const salary = (yield* sources.all)[0]!

        return yield* timeCostOfOverrides([
          new AddHypotheticalExpense({
            id: overrideId("o1"),
            name: "Holiday",
            amount: euros(6_000),
            date: date("2026-03-15")
          }),
          new ChangeIncome({
            id: overrideId("o2"),
            incomeSourceId: salary.id,
            monthlyNetBeforeTax: euros(4_000)
          })
        ])
      })
    )

    // The holiday costs three months; the raise buys six back.
    expect(
      cost.perChange.map((each) => ({ id: each.override, months: each.months }))
    ).toStrictEqual([
      { id: "o1", months: 3 },
      { id: "o2", months: -6 }
    ])
    expect(cost.months).toBe(-3)
  })

  it("reports a change that buys time back as negative months", async () => {
    const cost = await run(
      Effect.gen(function* () {
        yield* household
        const commitments = yield* Commitments
        return yield* timeCostOfOverrides([
          new DisableCommitment({
            id: overrideId("o1"),
            commitmentId: (yield* commitments.all)[0]!.id
          })
        ])
      })
    )

    expect(cost.months).toBe(-5)
  })

  it("gives no number where the simulation never gets there (SCN-05)", async () => {
    const cost = await run(
      Effect.gen(function* () {
        yield* household
        const sources = yield* IncomeSources
        const salary = (yield* sources.all)[0]!

        return yield* timeCostOfOverrides([
          new ChangeIncome({
            id: overrideId("o1"),
            incomeSourceId: salary.id,
            monthlyNetBeforeTax: euros(500)
          })
        ])
      })
    )

    // Losing €500 a month never reaches €40,000. "Never" is not "0 months".
    expect(cost.simulated).toBeUndefined()
    expect(cost.months).toBeUndefined()
  })
})
