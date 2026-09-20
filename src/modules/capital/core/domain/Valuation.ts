/**
 * What a holding is worth, and how sure that is (spec §71, §2.3).
 *
 * The rule is one line and the whole of §2.3 per holding: **the latest
 * snapshot on or before the date wins**. A holding with no snapshot is worth
 * zero rather than being an error — an account added before its balance is
 * known is an ordinary state, not a broken one (CAP-10).
 */
import { Data } from "effect"

import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import type { HoldingId, ValuationBasis } from "@/modules/capital/core/domain/Holding"

export class Valuation extends Data.Class<{
  readonly amount: Money.Money
  readonly asOf: LocalDate.LocalDate
  readonly basis: ValuationBasis
}> {}

const latest = (snapshots: ReadonlyArray<BalanceSnapshot>): BalanceSnapshot | undefined =>
  snapshots.reduce<BalanceSnapshot | undefined>(
    (newest, snapshot) =>
      newest === undefined || !LocalDate.isBefore(snapshot.date, newest.date) ? snapshot : newest,
    undefined
  )

export const valuationAt = (
  snapshots: ReadonlyArray<BalanceSnapshot>,
  on: LocalDate.LocalDate
): Valuation | undefined => {
  const eligible = snapshots.filter((snapshot) => !LocalDate.isAfter(snapshot.date, on))
  const newest = latest(eligible)

  return newest === undefined
    ? undefined
    : new Valuation({ amount: newest.amount, asOf: newest.date, basis: newest.basis })
}

export const amountOf = (valuation: Valuation | undefined): Money.Money =>
  valuation === undefined ? Money.zero : valuation.amount

export const forHolding = (
  snapshots: ReadonlyArray<BalanceSnapshot>,
  holding: HoldingId
): ReadonlyArray<BalanceSnapshot> => snapshots.filter((snapshot) => snapshot.holdingId === holding)

/** Spec CAP-06: a year-old guess is not the same claim as a recent one. */
export const STALE_AFTER_MONTHS = 12

export const isStale = (valuation: Valuation, on: LocalDate.LocalDate): boolean =>
  LocalDate.isBefore(valuation.asOf, LocalDate.addMonths(on, -STALE_AFTER_MONTHS))
