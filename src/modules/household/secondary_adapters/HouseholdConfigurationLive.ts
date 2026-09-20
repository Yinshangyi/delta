/**
 * The household and its people, in SQLite.
 *
 * Every failure becomes a `PersistenceError` before it leaves: a `SqlError`
 * carries the statement and sometimes the values bound to it, which here would
 * mean people's names in a log line and SQL in the domain's error channel.
 */
import { Effect, Layer, Option } from "effect"
import { SqlClient } from "effect/unstable/sql"

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
import { wrap } from "@/shared/domain/PersistenceError"

interface HouseholdRow {
  readonly id: string
  readonly name: string
}

interface PersonRow {
  readonly id: string
  readonly household_id: string
  readonly name: string
}

const personOf = (row: PersonRow): Person =>
  new Person({
    id: personId(row.id),
    householdId: householdId(row.household_id),
    name: row.name as Name
  })

type Sql = SqlClient.SqlClient

/** V1 manages exactly one household (spec §5), so there is never a second row. */
const currentHousehold = (sql: Sql) =>
  Effect.gen(function* () {
    const households = yield* sql<HouseholdRow>`SELECT id, name FROM households LIMIT 1`
    const row = households[0]
    if (row === undefined) return Option.none()

    const people = yield* sql<PersonRow>`
      SELECT id, household_id, name FROM people WHERE household_id = ${row.id} ORDER BY rowid
    `
    return Option.some(
      new Household({
        id: householdId(row.id),
        name: row.name as Name,
        members: people.map(personOf)
      })
    )
  }).pipe(Effect.mapError(wrap("load the household")))

const createHousehold = (sql: Sql) => (household: Name, firstPerson: Name) =>
  Effect.gen(function* () {
    const id = crypto.randomUUID()
    const member = crypto.randomUUID()
    yield* sql`INSERT INTO households (id, name) VALUES (${id}, ${household})`
    yield* sql`
      INSERT INTO people (id, household_id, name) VALUES (${member}, ${id}, ${firstPerson})
    `
    return new Household({
      id: householdId(id),
      name: household,
      members: [
        new Person({ id: personId(member), householdId: householdId(id), name: firstPerson })
      ]
    })
  }).pipe(Effect.mapError(wrap("create the household")))

const addPersonTo = (sql: Sql) => (id: HouseholdId, person: Name) =>
  Effect.gen(function* () {
    const member = crypto.randomUUID()
    yield* sql`INSERT INTO people (id, household_id, name) VALUES (${member}, ${id}, ${person})`
    return new Person({ id: personId(member), householdId: id, name: person })
  }).pipe(Effect.mapError(wrap("add a person")))

const renameHousehold = (sql: Sql) => (id: HouseholdId, to: Name) =>
  sql`UPDATE households SET name = ${to} WHERE id = ${id}`.pipe(
    Effect.asVoid,
    Effect.mapError(wrap("rename the household"))
  )

const renamePersonTo = (sql: Sql) => (id: PersonId, to: Name) =>
  sql`UPDATE people SET name = ${to} WHERE id = ${id}`.pipe(
    Effect.asVoid,
    Effect.mapError(wrap("rename a person"))
  )

const removePersonWith = (sql: Sql) => (id: PersonId) =>
  sql`DELETE FROM people WHERE id = ${id}`.pipe(
    Effect.asVoid,
    Effect.mapError(wrap("remove a person"))
  )

export const HouseholdConfigurationLive: Layer.Layer<
  typeof HouseholdConfiguration.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.effect(HouseholdConfiguration)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const shape: HouseholdConfigurationShape = {
      current: currentHousehold(sql),
      create: createHousehold(sql),
      rename: renameHousehold(sql),
      addPerson: addPersonTo(sql),
      renamePerson: renamePersonTo(sql),
      removePerson: removePersonWith(sql)
    }
    return shape
  })
)
