/**
 * The goal V1 projects toward, or nothing. The one read the goal screen and
 * the dashboard both make.
 */
import { Effect, type Option } from "effect"

import { Goals } from "@/modules/trajectory/core/ports/secondary/Goals"

import type { FinancialGoal } from "@/modules/trajectory/core/domain/FinancialGoal"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const activeGoal: Effect.Effect<
  Option.Option<FinancialGoal>,
  PersistenceError,
  typeof Goals.Identifier
> = Effect.gen(function* () {
  const goals = yield* Goals
  return yield* goals.enabled
})
