/**
 * Where a debt actually stands, and from which month its remaining payments
 * run (spec §21, §23, §2.3).
 *
 * The rule is the one the whole recalibration loop turns on: **the latest
 * snapshot wins over the forecast**. If Delta predicted €7,350 and the
 * household recorded €7,200, projections continue from €7,200 — and from the
 * month *after* the one it was recorded in, because that month's payment has
 * already happened and is reflected in the number.
 */
import { Data } from "effect"

import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { Debt } from "@/modules/commitments/core/domain/Commitment"
import type { DebtSnapshot } from "@/modules/commitments/core/domain/DebtSnapshot"
import type * as Money from "@/shared/domain/Money"

export class DebtPosition extends Data.Class<{
  readonly remaining: Money.Money
  /** The first month still to be paid. */
  readonly from: YearMonth.YearMonth
  /** True when this came from a recorded balance rather than the initial amount. */
  readonly fromSnapshot: boolean
}> {}

const latest = (snapshots: ReadonlyArray<DebtSnapshot>): DebtSnapshot | undefined =>
  snapshots.reduce<DebtSnapshot | undefined>(
    (newest, snapshot) =>
      newest === undefined || !LocalDate.isBefore(snapshot.date, newest.date) ? snapshot : newest,
    undefined
  )

export const positionOf = (debt: Debt, snapshots: ReadonlyArray<DebtSnapshot>): DebtPosition => {
  const newest = latest(snapshots)

  return newest === undefined
    ? new DebtPosition({
        remaining: debt.initialAmount,
        from: LocalDate.toYearMonth(debt.startDate),
        fromSnapshot: false
      })
    : new DebtPosition({
        remaining: newest.remainingAmount,
        from: YearMonth.addMonths(LocalDate.toYearMonth(newest.date), 1),
        fromSnapshot: true
      })
}
