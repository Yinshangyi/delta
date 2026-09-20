/**
 * A dated valuation of one holding (spec §71), generalising the original
 * single `SavingsSnapshot` of §15.
 *
 * The basis travels with the snapshot rather than being looked up from the
 * holding, because it is a property of the measurement: a balance read off a
 * statement is actual, an asking price is a guess, and a row restored from an
 * export has to carry which it was.
 */
import { Brand, Data } from "effect"

import type { HoldingId, ValuationBasis } from "@/modules/capital/core/domain/Holding"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"

export type BalanceSnapshotId = Brand.Branded<string, "BalanceSnapshotId">

export const balanceSnapshotId = (value: string): BalanceSnapshotId => value as BalanceSnapshotId

export class BalanceSnapshot extends Data.Class<{
  readonly id: BalanceSnapshotId
  readonly holdingId: HoldingId
  readonly date: LocalDate.LocalDate
  readonly amount: Money.Money
  readonly basis: ValuationBasis
}> {}
