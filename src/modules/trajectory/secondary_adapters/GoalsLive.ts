/**
 * Goals in SQLite. A row is data from outside the program, so the amount is
 * validated back into `Money` rather than cast, and a row that cannot be is a
 * `PersistenceError` rather than a broken goal loose in the projection.
 */
import { Effect, Layer, Option } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { householdId } from "@/modules/household/core/domain/Household"
import { FinancialGoal, financialGoalId } from "@/modules/trajectory/core/domain/FinancialGoal"
import { Goals, type GoalsShape } from "@/modules/trajectory/core/ports/secondary/Goals"
import * as Money from "@/shared/domain/Money"
import { wrap } from "@/shared/domain/PersistenceError"

interface GoalRow {
  readonly id: string
  readonly household_id: string
  readonly name: string
  readonly target_amount_cents: number
  readonly enabled: number
}

type Sql = SqlClient.SqlClient

const goalOf = (row: GoalRow) =>
  Effect.fromResult(Money.fromCents(row.target_amount_cents)).pipe(
    Effect.mapError(wrap("read a goal's target amount")),
    Effect.map(
      (targetAmount) =>
        new FinancialGoal({
          id: financialGoalId(row.id),
          householdId: householdId(row.household_id),
          name: row.name,
          targetAmount,
          enabled: row.enabled === 1
        })
    )
  )

const select = (sql: Sql) => (where: "all" | "enabled" | string) =>
  (where === "all"
    ? sql<GoalRow>`SELECT * FROM financial_goals ORDER BY rowid`
    : where === "enabled"
      ? sql<GoalRow>`SELECT * FROM financial_goals WHERE enabled = 1 ORDER BY rowid`
      : sql<GoalRow>`SELECT * FROM financial_goals WHERE household_id = ${where} ORDER BY rowid`
  ).pipe(
    Effect.mapError(wrap("load goals")),
    Effect.flatMap((rows) => Effect.all(rows.map(goalOf)))
  )

const saveGoal = (sql: Sql) => (goal: FinancialGoal) =>
  sql`
    INSERT OR REPLACE INTO financial_goals (
      id, household_id, name, target_amount_cents, enabled
    ) VALUES (
      ${goal.id}, ${goal.householdId}, ${goal.name},
      ${Money.toCents(goal.targetAmount)}, ${goal.enabled ? 1 : 0}
    )
  `.pipe(Effect.asVoid, Effect.mapError(wrap("save a goal")))

export const GoalsLive: Layer.Layer<typeof Goals.Identifier, never, SqlClient.SqlClient> =
  Layer.effect(Goals)(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const shape: GoalsShape = {
        nextId: Effect.sync(() => financialGoalId(crypto.randomUUID())),
        all: select(sql)("all"),
        enabled: select(sql)("enabled").pipe(Effect.map((goals) => Option.fromNullishOr(goals[0]))),
        forHousehold: (household) => select(sql)(household),
        save: saveGoal(sql),
        setEnabled: (id, enabled) =>
          sql`UPDATE financial_goals SET enabled = ${enabled ? 1 : 0} WHERE id = ${id}`.pipe(
            Effect.asVoid,
            Effect.mapError(wrap("enable or disable a goal"))
          ),
        remove: (id) =>
          sql`DELETE FROM financial_goals WHERE id = ${id}`.pipe(
            Effect.asVoid,
            Effect.mapError(wrap("remove a goal"))
          )
      }
      return shape
    })
  )
