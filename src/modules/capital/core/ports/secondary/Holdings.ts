/**
 * Somewhere to keep what the household owns.
 *
 * Named for intent rather than mechanism (architecture.md — Naming), and new:
 * spec §52 predates holdings entirely.
 */
import { Context, Effect } from "effect"

import type { Holding, HoldingId } from "@/modules/capital/core/domain/Holding"
import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface HoldingsShape {
  readonly nextId: Effect.Effect<HoldingId>
  readonly all: Effect.Effect<ReadonlyArray<Holding>, PersistenceError>
  readonly forHousehold: (
    household: HouseholdId
  ) => Effect.Effect<ReadonlyArray<Holding>, PersistenceError>
  readonly save: (holding: Holding) => Effect.Effect<void, PersistenceError>
  /** Spec §72: persistent configuration, not a transient filter. */
  readonly setIncluded: (id: HoldingId, included: boolean) => Effect.Effect<void, PersistenceError>
  /** Takes the holding's valuations with it — the schema cascades (CAP-09). */
  readonly remove: (id: HoldingId) => Effect.Effect<void, PersistenceError>
}

export const Holdings = Context.Service<HoldingsShape>("delta/capital/Holdings")
