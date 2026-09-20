/**
 * A stub, in Fowler's sense: canned answers held in memory, plus `inspect` so a
 * test can assert what was asked of it. Other modules' tests take this rather
 * than a database.
 */
import { Effect, Layer, Option } from "effect"

import {
  Household,
  type HouseholdId,
  householdId,
  type Name,
  Person,
  type PersonId,
  personId
} from "@/modules/household/core/domain/Household"
import {
  HouseholdConfiguration,
  type HouseholdConfigurationShape
} from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

export interface HouseholdConfigurationStubOptions {
  readonly existing?: Household | undefined
}

export const makeHouseholdConfigurationStub = (options: HouseholdConfigurationStubOptions = {}) => {
  let household = options.existing
  let nextId = 0

  const identifier = (prefix: string) => {
    nextId += 1
    return `${prefix}-${nextId}`
  }

  const shape: HouseholdConfigurationShape = {
    current: Effect.sync(() => {
      return Option.fromNullishOr(household)
    }),

    create: (nameOf, firstPerson) =>
      Effect.sync(() => {
        const id = householdId(identifier("household"))
        const created = new Household({
          id,
          name: nameOf,
          members: [
            new Person({ id: personId(identifier("person")), householdId: id, name: firstPerson })
          ]
        })
        household = created
        return created
      }),

    rename: (_id: HouseholdId, to: Name) =>
      Effect.sync(() => {
        if (household !== undefined) household = new Household({ ...household, name: to })
      }),

    addPerson: (id, personName) =>
      Effect.sync(() => {
        const person = new Person({
          id: personId(identifier("person")),
          householdId: id,
          name: personName
        })
        if (household !== undefined) {
          household = new Household({ ...household, members: [...household.members, person] })
        }
        return person
      }),

    renamePerson: (id: PersonId, to: Name) =>
      Effect.sync(() => {
        if (household === undefined) return
        household = new Household({
          ...household,
          members: household.members.map((member) =>
            member.id === id ? new Person({ ...member, name: to }) : member
          )
        })
      }),

    removePerson: (id) =>
      Effect.sync(() => {
        if (household === undefined) return
        household = new Household({
          ...household,
          members: household.members.filter((member) => member.id !== id)
        })
      })
  }

  return {
    layer: Layer.succeed(HouseholdConfiguration)(shape),
    inspect: () => ({ household })
  }
}
