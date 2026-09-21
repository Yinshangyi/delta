/**
 * Which commitments have a finish line, and everything a card needs to say
 * about each (TRJ-06, APP-06).
 *
 * Debts and tax liabilities only: a subscription has no end in sight and
 * belongs on the commitments screen rather than on a dashboard answering
 * "when do we get there?".
 *
 * Every figure here is already computed elsewhere — `DebtProgress` carries
 * remaining, percent and months left, and a tax schedule carries dated rows
 * with their own basis. This only chooses which of them a card shows.
 */
import { Match } from "effect"

import { progressOf } from "@/modules/commitments/core/domain/DebtAmortisation"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { Commitment, CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { TaxStatus } from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"

export interface DebtAhead {
  readonly kind: "debt"
  readonly id: string
  readonly name: string
  readonly remaining: Money.Money
  readonly initial: Money.Money
  readonly percentRepaid: number
  readonly monthly: Money.Money
  readonly monthsLeft: number | undefined
}

export interface TaxAhead {
  readonly kind: "tax"
  readonly id: string
  readonly name: string
  readonly status: TaxStatus
  readonly nextAmount: Money.Money | undefined
  readonly nextDate: LocalDate.LocalDate | undefined
  /** Which payment of how many, counting the one that is next. */
  readonly payment: number | undefined
  readonly payments: number
  readonly stillScheduled: Money.Money
  readonly total: Money.Money
}

export type CommitmentAhead = DebtAhead | TaxAhead

export const commitmentsAhead = (
  commitments: ReadonlyArray<Commitment>,
  positions: ReadonlyMap<CommitmentId, DebtPosition>,
  today: LocalDate.LocalDate
): ReadonlyArray<CommitmentAhead> =>
  commitments
    .filter((commitment) => commitment.enabled)
    .flatMap((commitment) =>
      Match.valueTags(commitment, {
        RecurringExpense: (): ReadonlyArray<CommitmentAhead> => [],
        OneOffExpense: (): ReadonlyArray<CommitmentAhead> => [],
        RecurringTaxPayment: (): ReadonlyArray<CommitmentAhead> => [],
        Debt: (debt): ReadonlyArray<CommitmentAhead> => {
          const position = positions.get(debt.id)
          if (position === undefined) return []
          const progress = progressOf(debt, position.remaining, position.from)
          return [
            {
              kind: "debt",
              id: debt.id,
              name: debt.name,
              remaining: progress.remaining,
              initial: progress.initial,
              percentRepaid: progress.percentRepaid,
              monthly: debt.regularPaymentAmount,
              monthsLeft: progress.paymentsRemaining
            }
          ]
        },
        TaxLiability: (tax): ReadonlyArray<CommitmentAhead> => [taxAhead(tax, today)]
      })
    )

const taxAhead = (
  tax: Extract<Commitment, { readonly _tag: "TaxLiability" }>,
  today: LocalDate.LocalDate
): TaxAhead => {
  const schedule = [...tax.paymentSchedule].sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = schedule.filter((payment) => !LocalDate.isBefore(payment.date, today))
  const next = upcoming[0]

  return {
    kind: "tax",
    id: tax.id,
    name: tax.name,
    status: tax.status,
    nextAmount: next?.amount,
    nextDate: next?.date,
    payment: next === undefined ? undefined : schedule.length - upcoming.length + 1,
    payments: schedule.length,
    stillScheduled: Money.sum(upcoming.map((payment) => payment.amount)),
    total: tax.amount
  }
}
