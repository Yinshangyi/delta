/** Recorded debt balances in SQLite (spec §21). */
import { Effect, Layer } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { commitmentId } from "@/modules/commitments/core/domain/Commitment"
import { DebtSnapshot, debtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import {
  DebtHistory,
  type DebtHistoryShape
} from "@/modules/commitments/core/ports/secondary/DebtHistory"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import { wrap } from "@/shared/domain/PersistenceError"

interface SnapshotRow {
  readonly id: string
  readonly debt_id: string
  readonly date: string
  readonly remaining_amount_cents: number
}

type Sql = SqlClient.SqlClient

const snapshotOf = (row: SnapshotRow) =>
  Effect.gen(function* () {
    return new DebtSnapshot({
      id: debtSnapshotId(row.id),
      debtId: commitmentId(row.debt_id),
      date: yield* Effect.fromResult(LocalDate.parse(row.date)),
      remainingAmount: yield* Effect.fromResult(Money.fromCents(row.remaining_amount_cents))
    })
  }).pipe(Effect.mapError(wrap(`read the debt snapshot ${row.id}`)))

const select = (sql: Sql) => (debt: string | undefined) =>
  (debt === undefined
    ? sql<SnapshotRow>`SELECT * FROM debt_snapshots ORDER BY date`
    : sql<SnapshotRow>`SELECT * FROM debt_snapshots WHERE debt_id = ${debt} ORDER BY date`
  ).pipe(
    Effect.mapError(wrap("load debt snapshots")),
    Effect.flatMap((rows) => Effect.all(rows.map(snapshotOf)))
  )

export const DebtHistoryLive: Layer.Layer<
  typeof DebtHistory.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.effect(DebtHistory)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const shape: DebtHistoryShape = {
      nextId: Effect.sync(() => debtSnapshotId(crypto.randomUUID())),
      all: select(sql)(undefined),
      forDebt: (debt) => select(sql)(debt),
      record: (snapshot) =>
        sql`
          INSERT OR REPLACE INTO debt_snapshots (id, debt_id, date, remaining_amount_cents)
          VALUES (
            ${snapshot.id}, ${snapshot.debtId}, ${LocalDate.toIso(snapshot.date)},
            ${Money.toCents(snapshot.remainingAmount)}
          )
        `.pipe(Effect.asVoid, Effect.mapError(wrap("record a debt balance"))),
      remove: (id) =>
        sql`DELETE FROM debt_snapshots WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(wrap("remove a debt snapshot"))
        )
    }
    return shape
  })
)
