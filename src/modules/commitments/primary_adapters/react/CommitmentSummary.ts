/**
 * What one commitment reads like in a list, as data rather than JSX.
 *
 * Each kind gets the line that actually matters about it (spec §28): a
 * recurring expense its monthly amount, a debt what is left and how long, a
 * tax liability its total and whether that total is known.
 */
import { Match } from "effect"

import { progressOf } from "@/modules/commitments/core/domain/DebtAmortisation"
import { KIND_LABELS } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type {
  Commitment,
  CommitmentId,
  CommitmentKind,
  Debt,
  OneOffExpense,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import type { DebtPosition } from "@/modules/commitments/core/domain/DebtPosition"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type * as Money from "@/shared/domain/Money"

export interface CommitmentSummary {
  readonly id: CommitmentId
  readonly kind: CommitmentKind
  readonly kindLabel: string
  readonly name: string
  readonly headline: string
  readonly detail: string | undefined
  /** Spec §26: an estimated liability must not read as an exact debt. */
  readonly estimated: boolean
  readonly enabled: boolean
}

const debtLine = (remaining: string, months: number | undefined): string =>
  months === undefined ? `${remaining} remaining` : `${remaining} remaining · ${months} months left`

interface Shared {
  readonly id: CommitmentId
  readonly name: string
  readonly enabled: boolean
}

const sharedOf = (commitment: Commitment): Shared => ({
  id: commitment.id,
  name: commitment.name,
  enabled: commitment.enabled
})

const recurring = (
  shared: Shared,
  kind: "RecurringExpense" | "RecurringTaxPayment",
  amount: Money.Money,
  endDate: LocalDate.LocalDate | undefined
): CommitmentSummary => ({
  ...shared,
  kind,
  kindLabel: KIND_LABELS[kind],
  headline: `${MoneyText.money(amount)} a month`,
  detail: endDate === undefined ? undefined : `until ${DateText.day(endDate)}`,
  estimated: false
})

const oneOff = (shared: Shared, expense: OneOffExpense): CommitmentSummary => ({
  ...shared,
  kind: "OneOffExpense",
  kindLabel: KIND_LABELS.OneOffExpense,
  headline: MoneyText.money(expense.amount),
  detail: DateText.day(expense.date),
  estimated: false
})

const owing = (
  shared: Shared,
  debt: Debt,
  positions: ReadonlyMap<CommitmentId, DebtPosition>
): CommitmentSummary => {
  const position = positions.get(debt.id)
  const progress =
    position === undefined ? undefined : progressOf(debt, position.remaining, position.from)

  return {
    ...shared,
    kind: "Debt",
    kindLabel: KIND_LABELS.Debt,
    headline:
      progress === undefined
        ? MoneyText.money(debt.initialAmount)
        : debtLine(MoneyText.money(progress.remaining), progress.paymentsRemaining),
    detail: `${MoneyText.money(debt.regularPaymentAmount)} a month`,
    estimated: false
  }
}

const liability = (shared: Shared, tax: TaxLiability): CommitmentSummary => ({
  ...shared,
  kind: "TaxLiability",
  kindLabel: KIND_LABELS.TaxLiability,
  headline: `${
    tax.status === "estimated" ? MoneyText.estimated(tax.amount) : MoneyText.money(tax.amount)
  } scheduled`,
  detail:
    tax.taxYear === undefined
      ? `${tax.paymentSchedule.length} payments`
      : `${tax.taxYear} · ${tax.paymentSchedule.length} payments`,
  estimated: tax.status === "estimated"
})

export const summarise = (
  commitment: Commitment,
  positions: ReadonlyMap<CommitmentId, DebtPosition>
): CommitmentSummary => {
  const shared = sharedOf(commitment)

  return Match.valueTags(commitment, {
    RecurringExpense: (expense) =>
      recurring(shared, "RecurringExpense", expense.amount, expense.period.endDate),
    OneOffExpense: (expense) => oneOff(shared, expense),
    Debt: (debt) => owing(shared, debt, positions),
    TaxLiability: (tax) => liability(shared, tax),
    RecurringTaxPayment: (payment) =>
      recurring(shared, "RecurringTaxPayment", payment.amount, payment.period.endDate)
  })
}
