/**
 * The shapes a form hands over: every field a plain string or number, exactly
 * as an input produces it.
 *
 * Validation happens on the way in, once, in the use case — so there is no
 * path by which an unparsed date or an amount that is not money reaches the
 * database, and no second copy of the rules living in a component.
 */
import type { TaxStatus } from "@/modules/commitments/core/domain/Commitment"
import type { HouseholdId, PersonId } from "@/modules/household/core/domain/Household"

export interface RecurringExpenseDraft {
  readonly kind: "RecurringExpense"
  readonly household: HouseholdId
  readonly name: string
  readonly amountEuros: number
  readonly startDate: string
  readonly endDate: string | undefined
}

export interface OneOffExpenseDraft {
  readonly kind: "OneOffExpense"
  readonly household: HouseholdId
  readonly name: string
  readonly amountEuros: number
  readonly date: string
}

export interface DebtDraft {
  readonly kind: "Debt"
  readonly household: HouseholdId
  readonly name: string
  readonly initialAmountEuros: number
  /** 0 is valid and common (CMT-04). */
  readonly interestRatePercent: number
  readonly regularPaymentEuros: number
  readonly startDate: string
}

export interface ScheduledPaymentDraft {
  readonly date: string
  readonly amountEuros: number
}

export interface TaxLiabilityDraft {
  readonly kind: "TaxLiability"
  readonly household: HouseholdId
  readonly name: string
  readonly taxYear: number | undefined
  readonly status: TaxStatus
  readonly amountEuros: number
  readonly schedule: ReadonlyArray<ScheduledPaymentDraft>
}

export interface RecurringTaxPaymentDraft {
  readonly kind: "RecurringTaxPayment"
  readonly household: HouseholdId
  readonly personId: PersonId | undefined
  readonly name: string
  readonly amountEuros: number
  readonly startDate: string
  readonly endDate: string | undefined
}

export type CommitmentDraft =
  | RecurringExpenseDraft
  | OneOffExpenseDraft
  | DebtDraft
  | TaxLiabilityDraft
  | RecurringTaxPaymentDraft
