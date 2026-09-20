/**
 * One household, holding one or more people (spec §5, §6).
 *
 * The domain must not assume exactly two people, one freelancer and one
 * employee, a couple, or any particular names. Nothing here counts members or
 * knows what they are called.
 */
import { Brand, Data, Result } from "effect"

export type HouseholdId = Brand.Branded<string, "HouseholdId">
export type PersonId = Brand.Branded<string, "PersonId">

export const householdId = (value: string): HouseholdId => value as HouseholdId
export const personId = (value: string): PersonId => value as PersonId

export class InvalidName extends Data.TaggedError("InvalidName")<{
  readonly value: string
  readonly reason: "empty" | "too-long"
}> {}

/** Long enough for any real name; short enough that a paste accident is caught. */
const MAX_NAME = 120

export type Name = Brand.Branded<string, "Name">

export const name = (value: string): Result.Result<Name, InvalidName> => {
  const trimmed = value.trim()
  if (trimmed.length === 0) return Result.fail(new InvalidName({ value, reason: "empty" }))
  if (trimmed.length > MAX_NAME) return Result.fail(new InvalidName({ value, reason: "too-long" }))
  return Result.succeed(trimmed as Name)
}

export class Person extends Data.Class<{
  readonly id: PersonId
  readonly householdId: HouseholdId
  readonly name: Name
}> {}

export class Household extends Data.Class<{
  readonly id: HouseholdId
  readonly name: Name
  readonly members: ReadonlyArray<Person>
}> {}

export class CannotRemoveLastPerson extends Data.TaggedError("CannotRemoveLastPerson")<{
  readonly householdId: HouseholdId
}> {}

/**
 * A household with nobody in it has no income and no meaning, so the last
 * person cannot be removed (spec §5: one or more people). The caller is told
 * why rather than finding the button quietly inert.
 */
export const withoutPerson = (
  household: Household,
  person: PersonId
): Result.Result<Household, CannotRemoveLastPerson> => {
  const remaining = household.members.filter((member) => member.id !== person)
  return remaining.length === household.members.length || remaining.length > 0
    ? Result.succeed(new Household({ ...household, members: remaining }))
    : Result.fail(new CannotRemoveLastPerson({ householdId: household.id }))
}
