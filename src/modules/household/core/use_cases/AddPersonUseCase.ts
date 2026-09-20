/**
 * A person needs only a name (spec §6). No income, no role, no position in a
 * couple — the household is any number of people, and this is the only thing
 * required to be one of them.
 */
import { Effect } from "effect"

import * as Household from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const addPerson = (
  household: Household.HouseholdId,
  person: string
): Effect.Effect<
  Household.Person,
  Household.InvalidName | PersistenceError,
  typeof HouseholdConfiguration.Identifier
> =>
  Effect.gen(function* () {
    const personName = yield* Effect.fromResult(Household.name(person))
    const configuration = yield* HouseholdConfiguration
    return yield* configuration.addPerson(household, personName)
  })
