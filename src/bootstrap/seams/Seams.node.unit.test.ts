import { Effect, Layer, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import { DatabaseInMemory } from "@/bootstrap/persistence/DatabaseInMemory"
import { MigrationsLive } from "@/bootstrap/persistence/Migrations"
import { seamsLayer } from "@/bootstrap/seams/Seams"
import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { addHolding } from "@/modules/capital/core/use_cases/AddHoldingUseCase"
import { capitalOverviewAt } from "@/modules/capital/core/use_cases/CapitalOverviewQuery"
import { setHoldingIncluded } from "@/modules/capital/core/use_cases/SetHoldingIncludedUseCase"
import { capitalAdaptersLayer } from "@/modules/capital/Dependencies"
import { saveCommitment } from "@/modules/commitments/core/use_cases/SaveCommitmentUseCase"
import { commitmentsAdaptersLayer } from "@/modules/commitments/Dependencies"
import { name } from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { addSalaryIncome } from "@/modules/household/core/use_cases/AddSalaryIncomeUseCase"
import { householdAdaptersLayer } from "@/modules/household/Dependencies"
import { netWorthAt } from "@/modules/trajectory/core/use_cases/NetWorthQuery"
import { projectionFrom } from "@/modules/trajectory/core/use_cases/ProjectionQuery"
import { setFinancialGoal } from "@/modules/trajectory/core/use_cases/SetFinancialGoalUseCase"
import { trajectoryAdaptersLayer } from "@/modules/trajectory/Dependencies"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import type { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import type { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import type { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import type { CashFlowSources } from "@/modules/trajectory/core/ports/secondary/CashFlowSources"
import type { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import type { OutstandingDebt } from "@/modules/trajectory/core/ports/secondary/OutstandingDebt"

/**
 * The whole app, wired as production wires it, over an in-memory database.
 *
 * This is the first test in which every module runs together — income,
 * commitments, capital and the engine — which is the point: the seams are the
 * thing most likely to be individually correct and jointly wrong.
 */
const persisted = MigrationsLive.pipe(Layer.provideMerge(DatabaseInMemory))
const modules = Layer.mergeAll(
  householdAdaptersLayer,
  trajectoryAdaptersLayer,
  commitmentsAdaptersLayer,
  capitalAdaptersLayer
).pipe(Layer.provideMerge(persisted))
const AppUnderTest = seamsLayer.pipe(Layer.provideMerge(modules))

type Services =
  | typeof HouseholdConfiguration.Identifier
  | typeof IncomeSources.Identifier
  | typeof Goals.Identifier
  | typeof Commitments.Identifier
  | typeof DebtHistory.Identifier
  | typeof Holdings.Identifier
  | typeof ValuationHistory.Identifier
  | typeof CashFlowSources.Identifier
  | typeof CapitalSources.Identifier
  | typeof OutstandingDebt.Identifier

const run = <A, E>(effect: Effect.Effect<A, E, Services>): Promise<A> =>
  Effect.runPromise(Effect.scoped(Effect.provide(effect, AppUnderTest)))

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const named = (value: string) => Result.getOrThrow(name(value))
const ASOF = date("2026-01-31")

const household: Effect.Effect<HouseholdId, never, Services> = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const created = yield* configuration.create(named("Home"), named("Ada"))
  return created.id
}).pipe(Effect.orDie)

/** €3,000 a month in, €1,000 a month out, €10,000 already saved. */
const simpleHousehold = Effect.gen(function* () {
  const owner = yield* household
  const configuration = yield* HouseholdConfiguration
  const people = Option.getOrThrow(yield* configuration.current).members

  yield* addSalaryIncome({
    personId: people[0]!.id,
    name: "Employment",
    monthlyNetBeforeTaxEuros: 3_000,
    monthlyIncomeTaxEuros: 0,
    annualGrossEuros: undefined,
    startDate: "2026-01-01",
    endDate: undefined
  })

  yield* saveCommitment({
    kind: "RecurringExpense",
    household: owner,
    name: "Rent",
    amountEuros: 1_000,
    startDate: "2026-01-01",
    endDate: undefined
  })

  yield* addHolding({
    kind: "BankAccount",
    household: owner,
    name: "Joint current account",
    institution: undefined,
    openingBalanceEuros: 10_000,
    balanceDate: "2026-01-31",
    today: "2026-01-31"
  })

  yield* setFinancialGoal({ household: owner, name: "Runway", targetEuros: 30_000 })
  return owner
}).pipe(Effect.orDie)

describe("the whole app, end to end", () => {
  it("projects income, commitments and capital together", async () => {
    const projection = Option.getOrThrow(
      await run(
        simpleHousehold.pipe(
          Effect.flatMap(() => projectionFrom({ from: ym("2026-01"), asOf: ASOF }))
        )
      )
    )

    // €10,000 + €2,000 a month reaches €30,000 in ten months.
    expect(projection.startingCapital).toBe(euros(10_000))
    expect(projection.result.months).toHaveLength(10)
    expect(projection.result.status._tag).toBe("Reachable")
  })

  it("reads capital at the same date the capital screen does", async () => {
    const { projected, onScreen } = await run(
      Effect.gen(function* () {
        yield* simpleHousehold
        const projection = Option.getOrThrow(
          yield* projectionFrom({ from: ym("2026-01"), asOf: ASOF })
        )
        const overview = yield* capitalOverviewAt(ASOF)
        return { projected: projection.startingCapital, onScreen: overview.total }
      })
    )

    // They disagreed once, and the screen showed €0 beside a target date that
    // had counted €10,000.
    expect(projected).toBe(onScreen)
  })

  it("has no projection before a goal is set, which is an ordinary state", async () => {
    const projection = await run(
      household.pipe(Effect.flatMap(() => projectionFrom({ from: ym("2026-01"), asOf: ASOF })))
    )

    expect(Option.isNone(projection)).toBe(true)
  })

  it("moves the target date when a holding is excluded (CAP-07)", async () => {
    const months = await run(
      Effect.gen(function* () {
        yield* simpleHousehold
        const holdings = yield* Holdings
        const account = (yield* holdings.all)[0]!

        const before = Option.getOrThrow(yield* projectionFrom({ from: ym("2026-01"), asOf: ASOF }))
        yield* setHoldingIncluded(account.id, false)
        const after = Option.getOrThrow(yield* projectionFrom({ from: ym("2026-01"), asOf: ASOF }))

        return { before: before.result.months.length, after: after.result.months.length }
      })
    )

    // Without the €10,000 it takes five months longer to reach €30,000.
    expect(months.before).toBe(10)
    expect(months.after).toBe(15)
  })

  it("gives capital of €0 and no reachable date when everything is excluded", async () => {
    const projection = await run(
      Effect.gen(function* () {
        yield* simpleHousehold
        const holdings = yield* Holdings
        for (const holding of yield* holdings.all) {
          yield* setHoldingIncluded(holding.id, false)
        }
        return Option.getOrThrow(
          yield* projectionFrom({ from: ym("2026-01"), asOf: ASOF, horizonMonths: 6 })
        )
      })
    )

    expect(projection.startingCapital).toBe(Money.zero)
    expect(projection.result.status._tag).toBe("NotReachable")
  })

  it("never subtracts debt from the starting balance (spec §77)", async () => {
    const projection = Option.getOrThrow(
      await run(
        Effect.gen(function* () {
          const owner = yield* simpleHousehold
          yield* saveCommitment({
            kind: "Debt",
            household: owner,
            name: "Card debt",
            initialAmountEuros: 6_000,
            interestRatePercent: 0,
            regularPaymentEuros: 500,
            startDate: "2026-01-01"
          })
          return yield* projectionFrom({ from: ym("2026-01"), asOf: ASOF })
        })
      )
    )

    // The €6,000 owed arrives as €500 a month, and the opening balance is
    // untouched. Subtracting it as well would show €4,000 here.
    expect(projection.startingCapital).toBe(euros(10_000))
  })
})

describe("net worth", () => {
  it("is capital minus what is still owed (CAP-11)", async () => {
    const worth = await run(
      Effect.gen(function* () {
        const owner = yield* household
        yield* addHolding({
          kind: "PhysicalAsset",
          household: owner,
          name: "Dive watch",
          category: "watch",
          resaleValueEuros: 15_000,
          valuationDate: "2026-01-31",
          acquisitionCostEuros: undefined,
          acquisitionDate: undefined,
          today: "2026-01-31"
        })
        yield* saveCommitment({
          kind: "Debt",
          household: owner,
          name: "Watch finance",
          initialAmountEuros: 9_500,
          interestRatePercent: 0,
          regularPaymentEuros: 375,
          startDate: "2026-02-01"
        })
        return yield* netWorthAt(date("2026-01-31"))
      })
    )

    // CAP-11's own example: €15,000 against €9,500 owed is €5,500 of equity.
    expect(worth.capital).toBe(euros(15_000))
    expect(worth.outstandingDebt).toBe(euros(9_500))
    expect(worth.netWorth).toBe(euros(5_500))
  })

  it("equals capital when nothing is owed", async () => {
    const worth = await run(
      Effect.gen(function* () {
        const owner = yield* household
        yield* addHolding({
          kind: "BankAccount",
          household: owner,
          name: "Joint current account",
          institution: undefined,
          openingBalanceEuros: 24_000,
          balanceDate: "2026-01-31",
          today: "2026-01-31"
        })
        return yield* netWorthAt(date("2026-01-31"))
      })
    )

    expect(worth.outstandingDebt).toBe(Money.zero)
    expect(worth.netWorth).toBe(worth.capital)
  })
})
