/** In-memory goals, with `inspect` for what a test needs to assert. */
import { Effect, Layer, Option } from "effect"

import { FinancialGoal, financialGoalId } from "@/modules/trajectory/core/domain/FinancialGoal"
import { Goals, type GoalsShape } from "@/modules/trajectory/core/ports/secondary/Goals"

export interface GoalsStubOptions {
  readonly goals?: ReadonlyArray<FinancialGoal>
}

export const makeGoalsStub = (options: GoalsStubOptions = {}) => {
  let goals: ReadonlyArray<FinancialGoal> = options.goals ?? []
  let minted = 0

  const shape: GoalsShape = {
    nextId: Effect.sync(() => {
      minted += 1
      return financialGoalId(`goal-${minted}`)
    }),

    all: Effect.sync(() => goals),

    enabled: Effect.sync(() => Option.fromNullishOr(goals.find((goal) => goal.enabled))),

    forHousehold: (household) =>
      Effect.sync(() => goals.filter((goal) => goal.householdId === household)),

    save: (goal) =>
      Effect.sync(() => {
        goals = [...goals.filter((each) => each.id !== goal.id), goal]
      }),

    setEnabled: (id, enabled) =>
      Effect.sync(() => {
        goals = goals.map((goal) =>
          goal.id === id ? new FinancialGoal({ ...goal, enabled }) : goal
        )
      }),

    remove: (id) =>
      Effect.sync(() => {
        goals = goals.filter((goal) => goal.id !== id)
      })
  }

  return { layer: Layer.succeed(Goals)(shape), inspect: () => ({ goals }) }
}
