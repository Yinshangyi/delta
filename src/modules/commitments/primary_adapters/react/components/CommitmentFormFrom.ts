/**
 * An existing commitment back into form state, so editing starts from what is
 * there rather than from blank fields.
 */
import { Match } from "effect"

import {
  type CommitmentFormState,
  emptyCommitmentForm
} from "@/modules/commitments/primary_adapters/react/components/CommitmentDraftState"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"

import type {
  Commitment,
  Debt,
  RecurringExpense,
  RecurringTaxPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"

const euros = (amount: Money.Money) => String(Money.toEuros(amount))

const iso = (date: LocalDate.LocalDate | undefined) =>
  date === undefined ? "" : LocalDate.toIso(date)

const monthly = (
  kind: "RecurringExpense" | "RecurringTaxPayment",
  commitment: RecurringExpense | RecurringTaxPayment
): CommitmentFormState => ({
  ...emptyCommitmentForm,
  kind,
  name: commitment.name,
  amountEuros: euros(commitment.amount),
  startDate: iso(commitment.period.startDate),
  endDate: iso(commitment.period.endDate)
})

const owing = (debt: Debt): CommitmentFormState => ({
  ...emptyCommitmentForm,
  kind: "Debt",
  name: debt.name,
  initialAmountEuros: euros(debt.initialAmount),
  interestRatePercent: String(Percentage.toPercent(debt.interestRate)),
  regularPaymentEuros: euros(debt.regularPaymentAmount),
  startDate: iso(debt.startDate)
})

const liability = (tax: TaxLiability): CommitmentFormState => ({
  ...emptyCommitmentForm,
  kind: "TaxLiability",
  name: tax.name,
  amountEuros: euros(tax.amount),
  taxYear: tax.taxYear === undefined ? "" : String(tax.taxYear),
  taxStatus: tax.status,
  schedule: tax.paymentSchedule.map((payment) => ({
    date: iso(payment.date),
    amountEuros: euros(payment.amount)
  }))
})

export const formStateFrom = (commitment: Commitment): CommitmentFormState =>
  Match.valueTags(commitment, {
    RecurringExpense: (expense) => monthly("RecurringExpense", expense),
    OneOffExpense: (expense) => ({
      ...emptyCommitmentForm,
      kind: "OneOffExpense" as const,
      name: expense.name,
      amountEuros: euros(expense.amount),
      oneOffDate: iso(expense.date)
    }),
    Debt: owing,
    TaxLiability: liability,
    RecurringTaxPayment: (payment) => monthly("RecurringTaxPayment", payment)
  })
