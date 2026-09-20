/**
 * Somewhere to keep the household's standing questions.
 *
 * Saving is explicit (SCN-02): building a simulation writes nothing, because
 * most of them are asked once and abandoned, and a list full of every idea
 * anybody tried is a list nobody reads.
 */
import { Context, Effect } from "effect"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { Scenario, ScenarioId } from "@/modules/scenarios/core/domain/Scenario"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface ScenariosShape {
  readonly nextId: Effect.Effect<ScenarioId>
  readonly all: Effect.Effect<ReadonlyArray<Scenario>, PersistenceError>
  readonly forHousehold: (
    household: HouseholdId
  ) => Effect.Effect<ReadonlyArray<Scenario>, PersistenceError>
  readonly save: (scenario: Scenario) => Effect.Effect<void, PersistenceError>
  readonly remove: (id: ScenarioId) => Effect.Effect<void, PersistenceError>
}

export const Scenarios = Context.Service<ScenariosShape>("delta/scenarios/Scenarios")
