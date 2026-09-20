/**
 * The seam the whole architecture turns on (spec §29, architecture.md).
 *
 * Every module converts what it knows into dated amounts, and the projection
 * engine consumes nothing else. It never learns that freelancers, salaries,
 * debts or watches exist — which is why adding rental income is one translator
 * inside `household` and no change to the engine at all.
 *
 * Positive is money arriving, negative is money leaving. `sourceId` and
 * `sourceKind` are for attribution in the month-by-month table; the engine
 * itself only ever sums `amount`.
 */
import { Data } from "effect"

import * as LocalDate from "@/shared/domain/LocalDate"

import type * as Money from "@/shared/domain/Money"
import type * as YearMonth from "@/shared/domain/YearMonth"

export class CashFlow extends Data.Class<{
  readonly date: LocalDate.LocalDate
  readonly amount: Money.Money
  readonly sourceId: string
  /** `freelance`, `salary`, `rent`, `debt`… — a label, never something to branch on. */
  readonly sourceKind: string
}> {}

export const make = (fields: {
  readonly date: LocalDate.LocalDate
  readonly amount: Money.Money
  readonly sourceId: string
  readonly sourceKind: string
}): CashFlow => new CashFlow(fields)

/** The projection runs monthly, so this is how a flow finds its bucket. */
export const monthOf = (flow: CashFlow): YearMonth.YearMonth => LocalDate.toYearMonth(flow.date)
