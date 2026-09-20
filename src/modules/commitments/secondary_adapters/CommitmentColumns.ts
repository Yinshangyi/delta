/**
 * Domain out, columns in — the mirror of `CommitmentRows`.
 *
 * One `Match.valueTags` fills the variant's own columns and nulls the rest,
 * so a sixth kind stops this compiling rather than quietly writing a row that
 * cannot be read back.
 */
import { Match } from "effect"

import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as Percentage from "@/shared/domain/Percentage"

import type { Commitment, ScheduledPayment } from "@/modules/commitments/core/domain/Commitment"

export interface CommitmentColumns {
  readonly kind: string
  readonly amount_cents: number | null
  readonly start_date: string | null
  readonly end_date: string | null
  readonly one_off_date: string | null
  readonly initial_amount_cents: number | null
  readonly interest_rate_basis_points: number | null
  readonly regular_payment_cents: number | null
  readonly tax_year: number | null
  readonly tax_status: string | null
  readonly person_id: string | null
}

const empty: Omit<CommitmentColumns, "kind"> = {
  amount_cents: null,
  start_date: null,
  end_date: null,
  one_off_date: null,
  initial_amount_cents: null,
  interest_rate_basis_points: null,
  regular_payment_cents: null,
  tax_year: null,
  tax_status: null,
  person_id: null
}

const iso = (date: LocalDate.LocalDate | undefined) =>
  date === undefined ? null : LocalDate.toIso(date)

export const columnsOf = (commitment: Commitment): CommitmentColumns =>
  Match.valueTags(commitment, {
    RecurringExpense: (expense) => ({
      ...empty,
      kind: "RecurringExpense",
      amount_cents: Money.toCents(expense.amount),
      start_date: iso(expense.period.startDate),
      end_date: iso(expense.period.endDate)
    }),
    OneOffExpense: (expense) => ({
      ...empty,
      kind: "OneOffExpense",
      amount_cents: Money.toCents(expense.amount),
      one_off_date: iso(expense.date)
    }),
    Debt: (debt) => ({
      ...empty,
      kind: "Debt",
      initial_amount_cents: Money.toCents(debt.initialAmount),
      interest_rate_basis_points: Percentage.toBasisPoints(debt.interestRate),
      regular_payment_cents: Money.toCents(debt.regularPaymentAmount),
      start_date: iso(debt.startDate)
    }),
    TaxLiability: (tax) => ({
      ...empty,
      kind: "TaxLiability",
      amount_cents: Money.toCents(tax.amount),
      tax_year: tax.taxYear ?? null,
      tax_status: tax.status
    }),
    RecurringTaxPayment: (payment) => ({
      ...empty,
      kind: "RecurringTaxPayment",
      amount_cents: Money.toCents(payment.amount),
      start_date: iso(payment.period.startDate),
      end_date: iso(payment.period.endDate),
      person_id: payment.personId ?? null
    })
  })

/** Only a tax liability has one; everything else writes no rows. */
export const scheduleOf = (commitment: Commitment): ReadonlyArray<ScheduledPayment> =>
  Match.valueTags(commitment, {
    RecurringExpense: () => [],
    OneOffExpense: () => [],
    Debt: () => [],
    TaxLiability: (tax) => tax.paymentSchedule,
    RecurringTaxPayment: () => []
  })
