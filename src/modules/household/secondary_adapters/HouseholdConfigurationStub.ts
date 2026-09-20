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

interface Memory {
  readonly read: () => Household | undefined
  readonly write: (household: Household | undefined) => void
  readonly nextId: (prefix: string) => string
}

const creating = (memory: Memory) => (nameOf: Name, firstPerson: Name) =>
  Effect.sync(() => {
    const id = householdId(memory.nextId("household"))
    const created = new Household({
      id,
      name: nameOf,
      members: [
        new Person({ id: personId(memory.nextId("person")), householdId: id, name: firstPerson })
      ]
    })
    memory.write(created)
    return created
  })

const adding = (memory: Memory) => (id: HouseholdId, personName: Name) =>
  Effect.sync(() => {
    const person = new Person({
      id: personId(memory.nextId("person")),
      householdId: id,
      name: personName
    })
    const household = memory.read()
    if (household !== undefined) {
      memory.write(new Household({ ...household, members: [...household.members, person] }))
    }
    return person
  })

/** Every mutation is the same shape: read, replace the members, write back. */
const revising =
  (memory: Memory) => (revise: (members: ReadonlyArray<Person>) => ReadonlyArray<Person>) =>
    Effect.sync(() => {
      const household = memory.read()
      if (household === undefined) return
      memory.write(new Household({ ...household, members: revise(household.members) }))
    })

export const makeHouseholdConfigurationStub = (options: HouseholdConfigurationStubOptions = {}) => {
  let household = options.existing
  let nextId = 0
  const memory: Memory = {
    read: () => household,
    write: (next) => {
      household = next
    },
    nextId: (prefix) => {
      nextId += 1
      return `${prefix}-${nextId}`
    }
  }
  const revise = revising(memory)

  const shape: HouseholdConfigurationShape = {
    current: Effect.sync(() => Option.fromNullishOr(memory.read())),
    create: creating(memory),
    addPerson: adding(memory),
    rename: (_id: HouseholdId, to: Name) =>
      Effect.sync(() => {
        const existing = memory.read()
        if (existing !== undefined) memory.write(new Household({ ...existing, name: to }))
      }),
    renamePerson: (id: PersonId, to: Name) =>
      revise((members) =>
        members.map((member) => (member.id === id ? new Person({ ...member, name: to }) : member))
      ),
    removePerson: (id) => revise((members) => members.filter((member) => member.id !== id))
  }

  return {
    layer: Layer.succeed(HouseholdConfiguration)(shape),
    inspect: () => ({ household: memory.read() })
  }
}
