/**
 * Which commitments have a finish line, and what to say about each.
 *
 * Debts and tax liabilities only: a subscription has no end in sight and
 * belongs on the commitments screen rather than on a dashboard answering
 * "when do we get there?".
 */
import { Match } from "effect"

import { progressOf } from "@/modules/commitments/core/domain/DebtAmortisation"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { Commitment, CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"
import type { CommitmentAhead } from "@/modules/trajectory/primary_adapters/react/components/CommitmentsAheadPanel"

const payoff = (months: number | undefined): string | undefined =>
  months === undefined ? undefined : `${months} ${months === 1 ? "month" : "months"} left`

export const commitmentsAhead = (
  commitments: ReadonlyArray<Commitment>,
  positions: ReadonlyMap<CommitmentId, DebtPosition>
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
              id: debt.id,
              name: debt.name,
              headline: `${MoneyText.money(progress.remaining)} remaining`,
              detail: payoff(progress.paymentsRemaining)
            }
          ]
        },
        TaxLiability: (tax): ReadonlyArray<CommitmentAhead> => {
          const next = [...tax.paymentSchedule].sort((a, b) => a.date.localeCompare(b.date))[0]
          return [
            {
              id: tax.id,
              name: tax.name,
              headline:
                tax.status === "estimated"
                  ? `${MoneyText.estimated(tax.amount)} scheduled`
                  : `${MoneyText.money(tax.amount)} scheduled`,
              detail: next === undefined ? undefined : `next ${DateText.day(next.date)}`
            }
          ]
        }
      })
    )
