import { Result } from "effect"
import { describe, expect, it } from "vitest"

import {
  Household,
  householdId,
  name,
  Person,
  personId,
  withoutPerson
} from "@/modules/household/core/domain/Household"

const named = (value: string) => Result.getOrThrow(name(value))

const failure = <A, E>(result: Result.Result<A, E>): E => Result.getOrThrow(Result.flip(result))

const person = (id: string, label: string) =>
  new Person({ id: personId(id), householdId: householdId("h1"), name: named(label) })

const household = (members: ReadonlyArray<Person>) =>
  new Household({ id: householdId("h1"), name: named("Home"), members })

describe("a name", () => {
  it("is trimmed, because a trailing space is not part of anyone's name", () => {
    expect(named("  Alex  ")).toBe("Alex")
  })

  it("cannot be empty or only whitespace", () => {
    expect(failure(name("")).reason).toBe("empty")
    expect(failure(name("   ")).reason).toBe("empty")
  })

  it("catches a paste accident rather than storing it", () => {
    expect(failure(name("x".repeat(200))).reason).toBe("too-long")
  })

  it("accepts the shapes real names come in", () => {
    for (const value of ["Jean-Loïc", "O'Brien", "李雷", "Anne Marie"]) {
      expect(named(value)).toBe(value)
    }
  })
})

describe("removing a person", () => {
  it("leaves the others in place", () => {
    const before = household([person("p1", "Sam"), person("p2", "Alex")])
    const after = Result.getOrThrow(withoutPerson(before, personId("p1")))
    expect(after.members.map((member) => member.name)).toStrictEqual(["Alex"])
  })

  it("is refused for the last one, with a reason rather than a dead button", () => {
    const before = household([person("p1", "Sam")])
    expect(failure(withoutPerson(before, personId("p1")))._tag).toBe("CannotRemoveLastPerson")
  })

  it("is a no-op for someone who is not a member", () => {
    const before = household([person("p1", "Sam")])
    const after = Result.getOrThrow(withoutPerson(before, personId("nobody")))
    expect(after.members).toHaveLength(1)
  })
})

describe("the household", () => {
  it("never assumes two people (spec §6)", () => {
    for (const size of [1, 2, 5]) {
      const members = Array.from({ length: size }, (_, index) =>
        person(`p${index}`, `Person ${index}`)
      )
      expect(household(members).members).toHaveLength(size)
    }
  })
})
