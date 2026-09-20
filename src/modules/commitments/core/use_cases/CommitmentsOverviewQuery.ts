/**
 * Everything the commitments screens show, in one read (spec §28): the flat
 * list, each debt's position, and the totals stated honestly.
 *
 * "Honestly" is the whole point of `CommitmentTotals`. A monthly figure and a
 * scheduled tax bill are not the same kind of number, and adding them would
 * produce a total that is true of no month at all.
 */
import { Data, Effect, Match } from "effect"

import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { DebtHistory } from "@/modules/commitments/core/ports/secondary/DebtHistory"
import { positionsOf } from "@/modules/commitments/core/use_cases/DebtPositionsQuery"
import * as Money from "@/shared/domain/Money"

import type { Commitment, CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export class CommitmentTotals extends Data.Class<{
  /** Leaves the household every month: expenses, debt payments, monthly tax. */
  readonly monthly: Money.Money
  /** Owed on a schedule rather than monthly — never added to the above. */
  readonly scheduledTax: Money.Money
  /** One-off purchases still ahead, which belong to no month but their own. */
  readonly oneOff: Money.Money
  readonly outstandingDebt: Money.Money
}> {}

export class CommitmentsOverview extends Data.Class<{
  readonly commitments: ReadonlyArray<Commitment>
  readonly positions: ReadonlyMap<CommitmentId, DebtPosition>
  readonly totals: CommitmentTotals
}> {}

const monthlyOf = (commitment: Commitment): Money.Money =>
  Match.valueTags(commitment, {
    RecurringExpense: (expense) => expense.amount,
    OneOffExpense: () => Money.zero,
    Debt: (debt) => debt.regularPaymentAmount,
    TaxLiability: () => Money.zero,
    RecurringTaxPayment: (payment) => payment.amount
  })

const scheduledOf = (commitment: Commitment): Money.Money =>
  Match.valueTags(commitment, {
    RecurringExpense: () => Money.zero,
    OneOffExpense: () => Money.zero,
    Debt: () => Money.zero,
    TaxLiability: (tax) => tax.amount,
    RecurringTaxPayment: () => Money.zero
  })

const oneOffOf = (commitment: Commitment): Money.Money =>
  Match.valueTags(commitment, {
    RecurringExpense: () => Money.zero,
    OneOffExpense: (expense) => expense.amount,
    Debt: () => Money.zero,
    TaxLiability: () => Money.zero,
    RecurringTaxPayment: () => Money.zero
  })

/** Disabled commitments are excluded: they are a record, not an obligation. */
export const totalsOf = (
  commitments: ReadonlyArray<Commitment>,
  positions: ReadonlyMap<CommitmentId, DebtPosition>
): CommitmentTotals => {
  const live = commitments.filter((commitment) => commitment.enabled)

  return new CommitmentTotals({
    monthly: Money.sum(live.map(monthlyOf)),
    scheduledTax: Money.sum(live.map(scheduledOf)),
    oneOff: Money.sum(live.map(oneOffOf)),
    outstandingDebt: Money.sum(
      live.flatMap((commitment) => {
        const position = positions.get(commitment.id)
        return position === undefined ? [] : [position.remaining]
      })
    )
  })
}

export const commitmentsOverview: Effect.Effect<
  CommitmentsOverview,
  PersistenceError,
  typeof Commitments.Identifier | typeof DebtHistory.Identifier
> = Effect.gen(function* () {
  const commitments = yield* Commitments
  const history = yield* DebtHistory
  const all = yield* commitments.all
  const positions = positionsOf(all, yield* history.all)

  return new CommitmentsOverview({ commitments: all, positions, totals: totalsOf(all, positions) })
})
