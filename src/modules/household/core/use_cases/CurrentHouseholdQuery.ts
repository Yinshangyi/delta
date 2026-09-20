/**
 * Whether setup has happened, and what it produced. The one read the shell
 * makes before deciding between onboarding and the app.
 */
import { Effect, type Option } from "effect"

import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

import type * as Household from "@/modules/household/core/domain/Household"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const currentHousehold: Effect.Effect<
  Option.Option<Household.Household>,
  PersistenceError,
  typeof HouseholdConfiguration.Identifier
> = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  return yield* configuration.current
})
