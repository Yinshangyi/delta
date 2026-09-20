/**
 * What the household module needs from the outside: somewhere to keep the
 * household and its people.
 *
 * Named for intent, not mechanism — this amends spec §52's `HouseholdRepository`
 * (see architecture.md). The core defines it; an adapter implements it.
 */
import { Context, type Effect, type Option } from "effect"

import type {
  Household,
  HouseholdId,
  Name,
  Person,
  PersonId
} from "@/modules/household/core/domain/Household"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface HouseholdConfigurationShape {
  /** Absent until first run — the one state the whole onboarding flow turns on. */
  readonly current: Effect.Effect<Option.Option<Household>, PersistenceError>
  readonly create: (
    household: Name,
    firstPerson: Name
  ) => Effect.Effect<Household, PersistenceError>
  readonly rename: (id: HouseholdId, to: Name) => Effect.Effect<void, PersistenceError>
  readonly addPerson: (id: HouseholdId, person: Name) => Effect.Effect<Person, PersistenceError>
  readonly renamePerson: (id: PersonId, to: Name) => Effect.Effect<void, PersistenceError>
  /** The domain refuses the last one; this only carries out a decision already made. */
  readonly removePerson: (id: PersonId) => Effect.Effect<void, PersistenceError>
}

export const HouseholdConfiguration = Context.Service<HouseholdConfigurationShape>(
  "delta/household/HouseholdConfiguration"
)
