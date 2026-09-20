/**
 * Somewhere to keep what the household is saving toward.
 *
 * Named for intent rather than mechanism, amending spec §52's `GoalRepository`
 * (architecture.md — Naming).
 */
import { Context, Effect, type Option } from "effect"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { FinancialGoal, FinancialGoalId } from "@/modules/trajectory/core/domain/FinancialGoal"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface GoalsShape {
  readonly nextId: Effect.Effect<FinancialGoalId>
  readonly all: Effect.Effect<ReadonlyArray<FinancialGoal>, PersistenceError>
  /**
   * The one V1 projects toward. `Option` rather than a thrown absence: a
   * household with no goal yet is an ordinary state, and the dashboard says so
   * (spec §65).
   */
  readonly enabled: Effect.Effect<Option.Option<FinancialGoal>, PersistenceError>
  readonly save: (goal: FinancialGoal) => Effect.Effect<void, PersistenceError>
  readonly setEnabled: (
    id: FinancialGoalId,
    enabled: boolean
  ) => Effect.Effect<void, PersistenceError>
  readonly remove: (id: FinancialGoalId) => Effect.Effect<void, PersistenceError>
  readonly forHousehold: (
    household: HouseholdId
  ) => Effect.Effect<ReadonlyArray<FinancialGoal>, PersistenceError>
}

export const Goals = Context.Service<GoalsShape>("delta/trajectory/Goals")
