import { Effect, Layer, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import { householdId } from "@/modules/household/core/domain/Household"
import { FinancialGoal, financialGoalId } from "@/modules/trajectory/core/domain/FinancialGoal"
import { planVariance } from "@/modules/trajectory/core/use_cases/PlanVarianceQuery"
import { projectionFrom } from "@/modules/trajectory/core/use_cases/ProjectionQuery"
import { makeCapitalSourcesStub } from "@/modules/trajectory/secondary_adapters/CapitalSourcesStub"
import { makeCashFlowSourcesStub } from "@/modules/trajectory/secondary_adapters/CashFlowSourcesStub"
import { makeGoalsStub } from "@/modules/trajectory/secondary_adapters/GoalsStub"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { CapitalSources } from "@/modules/trajectory/core/ports/secondary/CapitalSources"
import type { CashFlowSources } from "@/modules/trajectory/core/ports/secondary/CashFlowSources"
import type { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))

const monthly = (from: string, count: number, amount: number) =>
  Array.from({ length: count }, (_, index) =>
    CashFlow.make({
      date: LocalDate.lastDayOf(YearMonth.addMonths(ym(from), index)),
      amount: euros(amount),
      sourceId: "salary",
      sourceKind: "salary"
    })
  )

const goal = (target: number) =>
  new FinancialGoal({
    id: financialGoalId("g1"),
    householdId: householdId("h1"),
    name: "Runway",
    targetAmount: euros(target),
    enabled: true
  })

interface Setup {
  readonly target?: number
  readonly flows?: ReadonlyArray<CashFlow.CashFlow>
  readonly byDate?: ReadonlyMap<string, Money.Money>
  readonly total?: Money.Money
}

const run = <A, E>(
  setup: Setup,
  effect: Effect.Effect<
    A,
    E,
    typeof Goals.Identifier | typeof CapitalSources.Identifier | typeof CashFlowSources.Identifier
  >
): Promise<A> => {
  const goals = makeGoalsStub({ goals: setup.target === undefined ? [] : [goal(setup.target)] })
  const capital = makeCapitalSourcesStub({
    ...(setup.total === undefined ? {} : { total: setup.total }),
    ...(setup.byDate === undefined ? {} : { byDate: setup.byDate })
  })
  const flows = makeCashFlowSourcesStub({ flows: setup.flows ?? [] })

  return Effect.runPromise(
    Effect.provide(effect, Layer.mergeAll(goals.layer, capital.layer, flows.layer))
  )
}

describe("the projection, over the port alone", () => {
  it("changes when a stub supplies different flows, with nothing else touched (TRJ-03)", async () => {
    const lean = Option.getOrThrow(
      await run(
        { target: 6_000, flows: monthly("2026-01", 24, 1_000), total: Money.zero },
        projectionFrom({ from: ym("2026-01"), asOf: date("2026-01-31") })
      )
    )

    const generous = Option.getOrThrow(
      await run(
        { target: 6_000, flows: monthly("2026-01", 24, 2_000), total: Money.zero },
        projectionFrom({ from: ym("2026-01"), asOf: date("2026-01-31") })
      )
    )

    expect(lean.result.months).toHaveLength(6)
    expect(generous.result.months).toHaveLength(3)
  })

  it("asks the port for the range it actually needs", async () => {
    const flows = makeCashFlowSourcesStub({ flows: [] })
    const goals = makeGoalsStub({ goals: [goal(6_000)] })
    const capital = makeCapitalSourcesStub({ total: Money.zero })

    await Effect.runPromise(
      Effect.provide(
        projectionFrom({ from: ym("2026-01"), asOf: date("2026-01-31"), horizonMonths: 12 }),
        Layer.mergeAll(goals.layer, capital.layer, flows.layer)
      )
    )

    expect(flows.inspect().asked.map((each) => YearMonth.toIso(each.from))).toStrictEqual([
      "2026-01"
    ])
  })
})

describe("ahead of or behind plan", () => {
  /** €1,000 a month expected; €10,000 held in January. */
  const household = (byDate: ReadonlyMap<string, Money.Money>): Setup => ({
    target: 30_000,
    flows: monthly("2026-01", 60, 1_000),
    byDate
  })

  it("compares the latest reading with what was forecast for it", async () => {
    const variance = Option.getOrThrow(
      await run(
        household(
          new Map([
            ["2026-01-31", euros(10_000)],
            ["2026-04-30", euros(12_500)]
          ])
        ),
        planVariance
      )
    )

    // January's €10,000 plus €1,000 a month forecast €13,000 by April.
    expect(Money.toEuros(variance.expected)).toBe(13_000)
    expect(Money.toEuros(variance.actual)).toBe(12_500)
    expect(variance.standing).toBe("behind")
    expect(Money.toEuros(variance.difference)).toBe(-500)
  })

  it("states the movement of the target date, not only the money", async () => {
    const variance = Option.getOrThrow(
      await run(
        household(
          new Map([
            ["2026-01-31", euros(10_000)],
            ["2026-04-30", euros(12_500)]
          ])
        ),
        planVariance
      )
    )

    expect(variance.monthsMoved).toBe(1)
  })

  it("reports being ahead just as plainly", async () => {
    const variance = Option.getOrThrow(
      await run(
        household(
          new Map([
            ["2026-01-31", euros(10_000)],
            ["2026-04-30", euros(15_000)]
          ])
        ),
        planVariance
      )
    )

    expect(variance.standing).toBe("ahead")
    expect(Money.toEuros(variance.difference)).toBe(2_000)
  })

  it("has nothing to say with only one reading, rather than showing zero (TRJ-10)", async () => {
    const variance = await run(household(new Map([["2026-01-31", euros(10_000)]])), planVariance)

    expect(Option.isNone(variance)).toBe(true)
  })

  it("has nothing to say with two readings in the same month", async () => {
    const variance = await run(
      household(
        new Map([
          ["2026-01-15", euros(10_000)],
          ["2026-01-31", euros(12_000)]
        ])
      ),
      planVariance
    )

    expect(Option.isNone(variance)).toBe(true)
  })

  it("has nothing to say before a goal is set", async () => {
    const variance = await run(
      {
        flows: monthly("2026-01", 12, 1_000),
        byDate: new Map([
          ["2026-01-31", euros(10_000)],
          ["2026-04-30", euros(12_500)]
        ])
      },
      planVariance
    )

    expect(Option.isNone(variance)).toBe(true)
  })
})
