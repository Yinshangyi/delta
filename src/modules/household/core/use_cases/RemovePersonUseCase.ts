/**
 * Removal is refused when it would empty the household (spec §40). The refusal
 * is the domain's — `withoutPerson` makes the decision on the loaded household,
 * and the port only carries it out — so the caller receives a reason rather
 * than an inert button.
 */
import { Effect, Option } from "effect"

import * as Household from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const removePerson = (
  person: Household.PersonId
): Effect.Effect<
  void,
  Household.CannotRemoveLastPerson | Household.NoHousehold | PersistenceError,
  typeof HouseholdConfiguration.Identifier
> =>
  Effect.gen(function* () {
    const configuration = yield* HouseholdConfiguration
    const current = yield* configuration.current
    const household = yield* Option.match(current, {
      onNone: () => Effect.fail(new Household.NoHousehold()),
      onSome: (found: Household.Household) => Effect.succeed(found)
    })
    yield* Effect.fromResult(Household.withoutPerson(household, person))
    yield* configuration.removePerson(person)
  })
