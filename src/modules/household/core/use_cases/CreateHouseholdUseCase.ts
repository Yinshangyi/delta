/**
 * First run: name the household and its first member (spec §5, §65).
 *
 * Both names are validated before the port is touched, so a typo in the second
 * one cannot leave a half-made household behind.
 */
import { Effect } from "effect"

import * as Household from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const createHousehold = (
  household: string,
  firstPerson: string
): Effect.Effect<
  Household.Household,
  Household.InvalidName | PersistenceError,
  typeof HouseholdConfiguration.Identifier
> =>
  Effect.gen(function* () {
    const householdName = yield* Effect.fromResult(Household.name(household))
    const personName = yield* Effect.fromResult(Household.name(firstPerson))
    const configuration = yield* HouseholdConfiguration
    return yield* configuration.create(householdName, personName)
  })
