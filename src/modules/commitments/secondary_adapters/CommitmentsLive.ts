/**
 * Commitments in SQLite: one table with a `kind` discriminant, plus a row per
 * scheduled tax payment.
 *
 * Every failure becomes a `PersistenceError` before it leaves — a `SqlError`
 * carries the statement and the values bound to it, which here would mean the
 * household's figures in a log line.
 */
import { Effect, Layer } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { commitmentId } from "@/modules/commitments/core/domain/Commitment"
import {
  Commitments,
  type CommitmentsShape
} from "@/modules/commitments/core/ports/secondary/Commitments"
import { columnsOf, scheduleOf } from "@/modules/commitments/secondary_adapters/CommitmentColumns"
import {
  commitmentOf,
  type CommitmentRow,
  type ScheduleRow
} from "@/modules/commitments/secondary_adapters/CommitmentRows"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import { wrap } from "@/shared/domain/PersistenceError"

import type { Commitment } from "@/modules/commitments/core/domain/Commitment"

type Sql = SqlClient.SqlClient

const hydrate = (sql: Sql) => (rows: ReadonlyArray<CommitmentRow>) =>
  Effect.gen(function* () {
    if (rows.length === 0) return []
    const schedule = yield* sql<ScheduleRow>`
      SELECT commitment_id, date, amount_cents FROM scheduled_payments ORDER BY date
    `.pipe(Effect.mapError(wrap("load payment schedules")))

    return yield* Effect.all(
      rows.map((row) =>
        commitmentOf(
          row,
          schedule.filter((payment) => payment.commitment_id === row.id)
        )
      )
    )
  })

const select = (sql: Sql) => (household: string | undefined) =>
  (household === undefined
    ? sql<CommitmentRow>`SELECT * FROM commitments ORDER BY rowid`
    : sql<CommitmentRow>`SELECT * FROM commitments WHERE household_id = ${household} ORDER BY rowid`
  ).pipe(Effect.mapError(wrap("load commitments")), Effect.flatMap(hydrate(sql)))

const saveSchedule = (sql: Sql) => (commitment: Commitment) =>
  Effect.gen(function* () {
    yield* sql`DELETE FROM scheduled_payments WHERE commitment_id = ${commitment.id}`
    for (const payment of scheduleOf(commitment)) {
      yield* sql`
        INSERT INTO scheduled_payments (commitment_id, date, amount_cents)
        VALUES (${commitment.id}, ${LocalDate.toIso(payment.date)}, ${Money.toCents(payment.amount)})
      `
    }
  })

const saveCommitment = (sql: Sql) => (commitment: Commitment) =>
  Effect.gen(function* () {
    const columns = columnsOf(commitment)
    yield* sql`
      INSERT OR REPLACE INTO commitments (
        id, household_id, kind, name, enabled, amount_cents, start_date, end_date,
        one_off_date, initial_amount_cents, interest_rate_basis_points,
        regular_payment_cents, tax_year, tax_status, person_id
      ) VALUES (
        ${commitment.id}, ${commitment.householdId}, ${columns.kind}, ${commitment.name},
        ${commitment.enabled ? 1 : 0}, ${columns.amount_cents}, ${columns.start_date},
        ${columns.end_date}, ${columns.one_off_date}, ${columns.initial_amount_cents},
        ${columns.interest_rate_basis_points}, ${columns.regular_payment_cents},
        ${columns.tax_year}, ${columns.tax_status}, ${columns.person_id}
      )
    `
    yield* saveSchedule(sql)(commitment)
  }).pipe(Effect.mapError(wrap("save a commitment")))

export const CommitmentsLive: Layer.Layer<
  typeof Commitments.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.effect(Commitments)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const shape: CommitmentsShape = {
      nextId: Effect.sync(() => commitmentId(crypto.randomUUID())),
      all: select(sql)(undefined),
      forHousehold: (household) => select(sql)(household),
      save: saveCommitment(sql),
      setEnabled: (id, enabled) =>
        sql`UPDATE commitments SET enabled = ${enabled ? 1 : 0} WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(wrap("enable or disable a commitment"))
        ),
      remove: (id) =>
        sql`DELETE FROM commitments WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(wrap("remove a commitment"))
        )
    }
    return shape
  })
)
