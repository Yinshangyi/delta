/**
 * Everything the household screens show, in one read: the household, and each
 * member with what they earn.
 *
 * The grouping is here rather than in a component because it is the answer to a
 * question about the domain — who earns what — and because a container that
 * joined two atoms would re-derive it on every render.
 */
import { Effect, Option } from "effect"

import * as Household from "@/modules/household/core/domain/Household"
import { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"

import type { IncomeSource } from "@/modules/household/core/domain/IncomeSource"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface MemberIncome {
  readonly person: Household.Person
  readonly sources: ReadonlyArray<IncomeSource>
}

export interface HouseholdOverview {
  readonly household: Household.Household
  readonly members: ReadonlyArray<MemberIncome>
}

export const householdOverview: Effect.Effect<
  Option.Option<HouseholdOverview>,
  PersistenceError,
  typeof HouseholdConfiguration.Identifier | typeof IncomeSources.Identifier
> = Effect.gen(function* () {
  const configuration = yield* HouseholdConfiguration
  const current = yield* configuration.current
  if (Option.isNone(current)) return Option.none()

  const household = current.value
  const sources = yield* IncomeSources
  const all = yield* sources.all

  return Option.some({
    household,
    members: household.members.map((person) => ({
      person,
      sources: all.filter((source) => source.personId === person.id)
    }))
  })
})
