import { Effect, Option, Result } from "effect"
import { describe, expect, it } from "vitest"

import {
  Household,
  householdId,
  name,
  Person,
  personId
} from "@/modules/household/core/domain/Household"
import { addPerson } from "@/modules/household/core/use_cases/AddPersonUseCase"
import { createHousehold } from "@/modules/household/core/use_cases/CreateHouseholdUseCase"
import { currentHousehold } from "@/modules/household/core/use_cases/CurrentHouseholdQuery"
import { removePerson } from "@/modules/household/core/use_cases/RemovePersonUseCase"
import { renameHousehold } from "@/modules/household/core/use_cases/RenameHouseholdUseCase"
import { renamePerson } from "@/modules/household/core/use_cases/RenamePersonUseCase"
import { makeHouseholdConfigurationStub } from "@/modules/household/secondary_adapters/HouseholdConfigurationStub"

import type { HouseholdConfiguration } from "@/modules/household/core/ports/secondary/HouseholdConfiguration"

const named = (value: string) => Result.getOrThrow(name(value))

const withStub = <A, E>(
  existing: Household | undefined,
  use: (
    stub: ReturnType<typeof makeHouseholdConfigurationStub>
  ) => Effect.Effect<A, E, typeof HouseholdConfiguration.Identifier>
): Promise<A> => {
  const stub = makeHouseholdConfigurationStub({ existing })
  return Effect.runPromise(Effect.provide(use(stub), stub.layer))
}

const twoPeople = () => {
  const id = householdId("h1")
  return new Household({
    id,
    name: named("Home"),
    members: [
      new Person({ id: personId("p1"), householdId: id, name: named("Ada") }),
      new Person({ id: personId("p2"), householdId: id, name: named("Lin") })
    ]
  })
}

describe("household configuration use cases", () => {
  it("creates a household with its first member", async () => {
    const created = await withStub(undefined, () => createHousehold("Home", "Ada"))

    expect(created.name).toBe("Home")
    expect(created.members).toHaveLength(1)
  })

  it("refuses a blank name before the household is written", async () => {
    const outcome = await withStub(undefined, (stub) =>
      Effect.result(createHousehold("Home", "   ")).pipe(
        Effect.map((result) => ({ result, stored: stub.inspect().household }))
      )
    )

    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.stored).toBeUndefined()
  })

  it("reports an absent household rather than inventing one", async () => {
    const current = await withStub(undefined, () => currentHousehold)

    expect(Option.isNone(current)).toBe(true)
  })

  it("renames the household without touching its members", async () => {
    const household = await withStub(twoPeople(), (stub) =>
      renameHousehold(householdId("h1"), "Ada and Lin").pipe(
        Effect.map(() => stub.inspect().household)
      )
    )

    expect(household?.name).toBe("Ada and Lin")
    expect(household?.members).toHaveLength(2)
  })

  it("adds a person who has no income yet", async () => {
    const household = await withStub(twoPeople(), (stub) =>
      addPerson(householdId("h1"), "Sam").pipe(Effect.map(() => stub.inspect().household))
    )

    expect(household?.members.map((member) => member.name)).toStrictEqual(["Ada", "Lin", "Sam"])
  })

  it("keeps a renamed person's identity, which is what income hangs off", async () => {
    const household = await withStub(twoPeople(), (stub) =>
      renamePerson(personId("p1"), "Ada L.").pipe(Effect.map(() => stub.inspect().household))
    )

    const renamed = household?.members[0]
    expect(renamed?.id).toBe("p1")
    expect(renamed?.name).toBe("Ada L.")
  })

  it("removes a person", async () => {
    const household = await withStub(twoPeople(), (stub) =>
      removePerson(personId("p2")).pipe(Effect.map(() => stub.inspect().household))
    )

    expect(household?.members.map((member) => member.id)).toStrictEqual(["p1"])
  })

  it("refuses to remove the last person, and leaves them in place", async () => {
    const one = new Household({ ...twoPeople(), members: [twoPeople().members[0]!] })

    const outcome = await withStub(one, (stub) =>
      Effect.result(removePerson(personId("p1"))).pipe(
        Effect.map((result) => ({ result, stored: stub.inspect().household }))
      )
    )

    expect(Result.isFailure(outcome.result)).toBe(true)
    expect(outcome.stored?.members).toHaveLength(1)
  })

  it("refuses removal when there is no household at all", async () => {
    const outcome = await withStub(undefined, () => Effect.result(removePerson(personId("p1"))))

    expect(Result.isFailure(outcome)).toBe(true)
  })
})
