/** Dated valuations in SQLite (spec §71). */
import { Effect, Layer } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { BalanceSnapshot, balanceSnapshotId } from "@/modules/capital/core/domain/BalanceSnapshot"
import { holdingId } from "@/modules/capital/core/domain/Holding"
import {
  ValuationHistory,
  type ValuationHistoryShape
} from "@/modules/capital/core/ports/secondary/ValuationHistory"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import { wrap } from "@/shared/domain/PersistenceError"

import type { ValuationBasis } from "@/modules/capital/core/domain/Holding"

interface SnapshotRow {
  readonly id: string
  readonly holding_id: string
  readonly date: string
  readonly amount_cents: number
  readonly basis: string
}

type Sql = SqlClient.SqlClient

const snapshotOf = (row: SnapshotRow) => {
  const failed = wrap(`read the valuation ${row.id}`)

  // Bound before the generator: the narrowing from the guard does not survive
  // into the closure, and a cast would defeat the point of checking.
  const basis: ValuationBasis | undefined =
    row.basis === "actual" || row.basis === "estimated" ? row.basis : undefined

  if (basis === undefined) {
    return Effect.fail(failed(`unknown valuation basis ${row.basis}`))
  }

  return Effect.gen(function* () {
    return new BalanceSnapshot({
      id: balanceSnapshotId(row.id),
      holdingId: holdingId(row.holding_id),
      date: yield* Effect.fromResult(LocalDate.parse(row.date)),
      amount: yield* Effect.fromResult(Money.fromCents(row.amount_cents)),
      basis
    })
  }).pipe(Effect.mapError(failed))
}

const select = (sql: Sql) => (holding: string | undefined) =>
  (holding === undefined
    ? sql<SnapshotRow>`SELECT * FROM balance_snapshots ORDER BY date`
    : sql<SnapshotRow>`SELECT * FROM balance_snapshots WHERE holding_id = ${holding} ORDER BY date`
  ).pipe(
    Effect.mapError(wrap("load valuations")),
    Effect.flatMap((rows) => Effect.all(rows.map(snapshotOf)))
  )

export const ValuationHistoryLive: Layer.Layer<
  typeof ValuationHistory.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.effect(ValuationHistory)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const shape: ValuationHistoryShape = {
      nextId: Effect.sync(() => balanceSnapshotId(crypto.randomUUID())),
      all: select(sql)(undefined),
      forHolding: (holding) => select(sql)(holding),
      record: (snapshot) =>
        sql`
          INSERT OR REPLACE INTO balance_snapshots (id, holding_id, date, amount_cents, basis)
          VALUES (
            ${snapshot.id}, ${snapshot.holdingId}, ${LocalDate.toIso(snapshot.date)},
            ${Money.toCents(snapshot.amount)}, ${snapshot.basis}
          )
        `.pipe(Effect.asVoid, Effect.mapError(wrap("record a valuation"))),
      remove: (id) =>
        sql`DELETE FROM balance_snapshots WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(wrap("remove a valuation"))
        )
    }
    return shape
  })
)
