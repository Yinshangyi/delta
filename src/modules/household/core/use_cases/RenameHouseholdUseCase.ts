/** The household name set at first run stays editable (spec §65). */
import { Effect } from "effect"

import * as Household from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const renameHousehold = (
  id: Household.HouseholdId,
  to: string
): Effect.Effect<
  void,
  Household.InvalidName | PersistenceError,
  typeof HouseholdConfiguration.Identifier
> =>
  Effect.gen(function* () {
    const next = yield* Effect.fromResult(Household.name(to))
    const configuration = yield* HouseholdConfiguration
    yield* configuration.rename(id, next)
  })
