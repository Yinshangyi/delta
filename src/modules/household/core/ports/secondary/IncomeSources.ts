/**
 * Somewhere to keep what each person earns. Separate from
 * `HouseholdConfiguration` because the two change for different reasons: a
 * household is renamed once, income is edited constantly.
 */
import { Context, Effect } from "effect"

import type { PersonId } from "@/modules/household/core/domain/Household"
import type { IncomeSource, IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface IncomeSourcesShape {
  /**
   * Identity is infrastructure, not domain. A use case that called
   * `crypto.randomUUID` itself would be untestable and would put a browser
   * global in `core/`.
   */
  readonly nextId: Effect.Effect<IncomeSourceId>
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
