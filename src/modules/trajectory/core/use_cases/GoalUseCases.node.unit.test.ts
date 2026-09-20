import { Effect, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import { householdId } from "@/modules/household/core/domain/Household"
import { FinancialGoal, financialGoalId } from "@/modules/trajectory/core/domain/FinancialGoal"
import { activeGoal } from "@/modules/trajectory/core/use_cases/ActiveGoalQuery"
import { setFinancialGoal } from "@/modules/trajectory/core/use_cases/SetFinancialGoalUseCase"
import { setGoalEnabled } from "@/modules/trajectory/core/use_cases/SetGoalEnabledUseCase"
import { makeGoalsStub } from "@/modules/trajectory/secondary_adapters/GoalsStub"
import * as Money from "@/shared/domain/Money"

import type { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))

const withStub = <A, E>(
  goals: ReadonlyArray<FinancialGoal>,
  use: (stub: ReturnType<typeof makeGoalsStub>) => Effect.Effect<A, E, typeof Goals.Identifier>
): Promise<A> => {
  const stub = makeGoalsStub({ goals })
  return Effect.runPromise(Effect.provide(use(stub), stub.layer))
}

const existing = () =>
  new FinancialGoal({
    id: financialGoalId("g1"),
    householdId: householdId("h1"),
    name: "Runway",
    targetAmount: euros(150_000),
    enabled: true
  })

const draft = () => ({ household: householdId("h1"), name: "Runway", targetEuros: 150_000 })

describe("the financial goal", () => {
  it("is whatever was entered, with nothing seeded", async () => {
    const saved = await withStub([], () => setFinancialGoal(draft()))

    expect(saved.name).toBe("Runway")
    expect(saved.targetAmount).toBe(euros(150_000))
    expect(saved.enabled).toBe(true)
  })

  it("changes the existing goal rather than accumulating a second one", async () => {
    const goals = await withStub([existing()], (stub) =>
      setFinancialGoal({ ...draft(), targetEuros: 200_000 }).pipe(
        Effect.map(() => stub.inspect().goals)
      )
    )

    expect(goals).toHaveLength(1)
    expect(goals[0]?.targetAmount).toBe(euros(200_000))
  })

  it("refuses an unnamed goal", async () => {
    const outcome = await withStub([], () =>
      Effect.result(setFinancialGoal({ ...draft(), name: " " }))
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("refuses a target of zero, which is reached before it is set", async () => {
    const outcome = await withStub([], () =>
      Effect.result(setFinancialGoal({ ...draft(), targetEuros: 0 }))
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("refuses a negative target, which can never be reached", async () => {
    const outcome = await withStub([], () =>
      Effect.result(setFinancialGoal({ ...draft(), targetEuros: -1 }))
    )

    expect(Result.isFailure(outcome)).toBe(true)
  })

  it("is absent until one is set, which is an ordinary state", async () => {
    expect(Option.isNone(await withStub([], () => activeGoal))).toBe(true)
  })

  it("disappears from the projection when switched off, keeping its figures", async () => {
    const { active, goals } = await withStub([existing()], (stub) =>
      setGoalEnabled(financialGoalId("g1"), false).pipe(
        Effect.flatMap(() => activeGoal),
        Effect.map((active) => ({ active, goals: stub.inspect().goals }))
      )
    )

    expect(Option.isNone(active)).toBe(true)
    expect(goals[0]?.targetAmount).toBe(euros(150_000))
  })
})
