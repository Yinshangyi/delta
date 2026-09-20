/**
 * Override rows in and out. A column per parameter rather than a blob, so a
 * row that cannot be read back into the union is a `PersistenceError` rather
 * than an override that silently does nothing.
 */
import { Effect } from "effect"

import { holdingId } from "@/modules/capital/core/domain/Holding"
import { commitmentId } from "@/modules/commitments/core/domain/Commitment"
import { incomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import {
  AddHypotheticalExpense,
  ChangeBillableDays,
  ChangeDailyRate,
  ChangeHoldingValue,
  ChangeIncome,
  ChangePayoutRatio,
  DisableCommitment,
  ExcludeHolding,
  overrideId
} from "@/modules/scenarios/core/domain/Scenario"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as Percentage from "@/shared/domain/Percentage"
import { type PersistenceError, wrap } from "@/shared/domain/PersistenceError"

import type { OverrideId, ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"

export interface OverrideRow {
  readonly id: string
  readonly scenario_id: string
  readonly position: number
  readonly kind: string
  readonly income_source_id: string | null
  readonly commitment_id: string | null
  readonly holding_id: string | null
  readonly amount_cents: number | null
  readonly basis_points: number | null
  readonly days: number | null
  readonly date: string | null
  readonly name: string | null
}

export interface OverrideColumns {
  readonly kind: string
  readonly income_source_id: string | null
  readonly commitment_id: string | null
  readonly holding_id: string | null
  readonly amount_cents: number | null
  readonly basis_points: number | null
  readonly days: number | null
  readonly date: string | null
  readonly name: string | null
}

const failed = (row: OverrideRow) => wrap(`read the scenario override ${row.id}`)

const money = (row: OverrideRow) =>
  Effect.fromResult(Money.fromCents(row.amount_cents ?? Number.NaN)).pipe(
    Effect.mapError(failed(row))
  )

const income = (row: OverrideRow) => incomeSourceId(row.income_source_id ?? "")

/** The four that name an income source. */
const incomeOverrideOf = (
  row: OverrideRow,
  id: OverrideId
): Effect.Effect<ScenarioOverride, PersistenceError> | undefined => {
  const fail = failed(row)
  const incomeSourceId = income(row)

  switch (row.kind) {
    case "ChangeDailyRate":
      return money(row).pipe(
        Effect.flatMap((amount) => Effect.fromResult(DailyRate.fromMoney(amount))),
        Effect.mapError(fail),
        Effect.map((dailyRate) => new ChangeDailyRate({ id, incomeSourceId, dailyRate }))
      )
    case "ChangeBillableDays":
      return Effect.fromResult(BillableDays.fromNumber(row.days ?? Number.NaN)).pipe(
        Effect.mapError(fail),
        Effect.map((standard) => new ChangeBillableDays({ id, incomeSourceId, standard }))
      )
    case "ChangePayoutRatio":
      return Effect.fromResult(
        Percentage.fromStoredBasisPoints(row.basis_points ?? Number.NaN)
      ).pipe(
        Effect.flatMap((percentage) =>
          Effect.fromResult(PayoutRatio.fromPercent(Percentage.toPercent(percentage)))
        ),
        Effect.mapError(fail),
        Effect.map((ratio) => new ChangePayoutRatio({ id, incomeSourceId, ratio }))
      )
    case "ChangeIncome":
      return money(row).pipe(
        Effect.map(
          (monthlyNetBeforeTax) => new ChangeIncome({ id, incomeSourceId, monthlyNetBeforeTax })
        )
      )
    default:
      return undefined
  }
}

export const overrideOf = (row: OverrideRow): Effect.Effect<ScenarioOverride, PersistenceError> => {
  const id = overrideId(row.id)
  const fail = failed(row)
  const onIncome = incomeOverrideOf(row, id)
  if (onIncome !== undefined) return onIncome

  switch (row.kind) {
    case "AddHypotheticalExpense":
      return Effect.all([money(row), Effect.fromResult(LocalDate.parse(row.date ?? ""))]).pipe(
        Effect.mapError(fail),
        Effect.map(
          ([amount, date]) => new AddHypotheticalExpense({ id, name: row.name ?? "", amount, date })
        )
      )
    case "DisableCommitment":
      return Effect.succeed(
        new DisableCommitment({ id, commitmentId: commitmentId(row.commitment_id ?? "") })
      )
    case "ExcludeHolding":
      return Effect.succeed(new ExcludeHolding({ id, holdingId: holdingId(row.holding_id ?? "") }))
    case "ChangeHoldingValue":
      return money(row).pipe(
        Effect.map(
          (amount) =>
            new ChangeHoldingValue({ id, holdingId: holdingId(row.holding_id ?? ""), amount })
        )
      )
    default:
      return Effect.fail(fail(`unknown override kind ${row.kind}`))
  }
}
