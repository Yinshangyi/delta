/**
 * Renaming touches the person row only. Income sources reference the person by
 * id, so they stay attached without anything here saying so (spec §39).
 */
import { Effect } from "effect"

import * as Household from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const renamePerson = (
  person: Household.PersonId,
  to: string
): Effect.Effect<
  void,
  Household.InvalidName | PersistenceError,
  typeof HouseholdConfiguration.Identifier
> =>
  Effect.gen(function* () {
    const next = yield* Effect.fromResult(Household.name(to))
    const configuration = yield* HouseholdConfiguration
    yield* configuration.renamePerson(person, next)
  })
