/**
 * Run the projection under a set of overrides (SCN-03, SCN-04).
 *
 * The port exists because swapping a layer is composition, and composition is
 * the root's job — a use case cannot build the adapters it wants to run under.
 * What the core states here is the *question*: "what would the trajectory be
 * with these changes?", with the empty list meaning "as things actually are".
 *
 * The engine on the other side is the same engine (spec §36). It is never told
 * a scenario is active, which is what makes a time cost a diff of two runs of
 * one piece of code rather than a second, drifting calculation.
 */
import { Context, type Effect, type Option } from "effect"

import type { ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"
import type { Projection } from "@/modules/trajectory/core/use_cases/ProjectionQuery"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface ScenarioProjectionsShape {
  readonly under: (
    overrides: ReadonlyArray<ScenarioOverride>
  ) => Effect.Effect<Option.Option<Projection>, PersistenceError>
}

export const ScenarioProjections = Context.Service<ScenarioProjectionsShape>(
  "delta/scenarios/ScenarioProjections"
)
