/**
 * Set or change what the household is saving toward (spec §14).
 *
 * One use case for both, because from the person's side there is one action —
 * "this is the goal" — and an update that had to be told whether it was
 * creating would push that decision into a form.
 */
import { Effect, Option } from "effect"

import {
  FinancialGoal,
  type InvalidGoal,
  validate
} from "@/modules/trajectory/core/domain/FinancialGoal"
import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"
import * as Money from "@/shared/domain/Money"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface FinancialGoalDraft {
  readonly household: HouseholdId
  readonly name: string
  readonly targetEuros: number
}

export const setFinancialGoal = (
  draft: FinancialGoalDraft
): Effect.Effect<
  FinancialGoal,
  InvalidGoal | Money.InvalidMoney | PersistenceError,
  typeof Goals.Identifier
> =>
  Effect.gen(function* () {
    const amount = yield* Effect.fromResult(Money.fromEuros(draft.targetEuros))
    const valid = yield* Effect.fromResult(validate(draft.name, amount))

    const goals = yield* Goals
    const existing = yield* goals.enabled
    const goal = new FinancialGoal({
      id: yield* Option.match(existing, {
        onNone: () => goals.nextId,
        onSome: (found: FinancialGoal) => Effect.succeed(found.id)
      }),
      householdId: draft.household,
      name: valid.name,
      targetAmount: valid.targetAmount,
      enabled: true
    })

    yield* goals.save(goal)
    return goal
  })
