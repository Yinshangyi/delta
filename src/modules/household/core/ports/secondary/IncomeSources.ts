/**
 * Somewhere to keep what each person earns. Separate from
 * `HouseholdConfiguration` because the two change for different reasons: a
 * household is renamed once, income is edited constantly.
 */
import { Context, type Effect } from "effect"

import type { PersonId } from "@/modules/household/core/domain/Household"
import type { IncomeSource, IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface IncomeSourcesShape {
  readonly all: Effect.Effect<ReadonlyArray<IncomeSource>, PersistenceError>
  readonly forPerson: (
    person: PersonId
  ) => Effect.Effect<ReadonlyArray<IncomeSource>, PersistenceError>
  readonly save: (source: IncomeSource) => Effect.Effect<void, PersistenceError>
  readonly setEnabled: (
    id: IncomeSourceId,
    enabled: boolean
  ) => Effect.Effect<void, PersistenceError>
  readonly remove: (id: IncomeSourceId) => Effect.Effect<void, PersistenceError>
}

export const IncomeSources = Context.Service<IncomeSourcesShape>("delta/household/IncomeSources")
