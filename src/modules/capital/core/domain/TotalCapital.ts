/**
 * The projection's starting balance (spec §73, §77).
 *
 * **Gross, always.** Outstanding debt is never subtracted here, and this
 * module cannot subtract it even by accident: `capital` does not know that
 * `commitments` exists. Debt already enters the projection as scheduled cash
 * flows (§22), so netting it off the opening balance too counts it twice and
 * pushes the target date out by the whole amount owed.
 *
 * Net worth — capital minus what is still owed — is a separate, derived figure
 * for display, computed where both modules are visible and never fed to the
 * engine (§77, CAP-11).
 */
import { Data } from "effect"

import { countsTowardCapital } from "@/modules/capital/core/domain/Holding"
import { amountOf, forHolding, valuationAt } from "@/modules/capital/core/domain/Valuation"
import * as Money from "@/shared/domain/Money"

import type { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import type { Holding } from "@/modules/capital/core/domain/Holding"
import type { Valuation } from "@/modules/capital/core/domain/Valuation"
import type * as LocalDate from "@/shared/domain/LocalDate"

export class ValuedHolding extends Data.Class<{
  readonly holding: Holding
  /** Absent until a balance is recorded, which is an ordinary state. */
  readonly valuation: Valuation | undefined
}> {}

export const valueHoldings = (
  holdings: ReadonlyArray<Holding>,
  snapshots: ReadonlyArray<BalanceSnapshot>,
  on: LocalDate.LocalDate
): ReadonlyArray<ValuedHolding> =>
  holdings.map(
    (holding) =>
      new ValuedHolding({
        holding,
        valuation: valuationAt(forHolding(snapshots, holding.id), on)
      })
  )

/**
 * Excluding every holding gives €0 — a deliberate answer to "how far are we if
 * we count nothing?", not an error (CAP-07).
 */
export const totalOf = (valued: ReadonlyArray<ValuedHolding>): Money.Money =>
  Money.sum(
    valued
      .filter((each) => countsTowardCapital(each.holding))
      .map((each) => amountOf(each.valuation))
  )
