/** A goal can be switched off without losing what it was (spec §14). */
import { Effect } from "effect"

import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"

import type { FinancialGoalId } from "@/modules/trajectory/core/domain/FinancialGoal"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const setGoalEnabled = (
  id: FinancialGoalId,
  enabled: boolean
): Effect.Effect<void, PersistenceError, typeof Goals.Identifier> =>
  Effect.gen(function* () {
    const goals = yield* Goals
    yield* goals.setEnabled(id, enabled)
  })
