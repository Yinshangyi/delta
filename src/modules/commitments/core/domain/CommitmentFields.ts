/**
 * The few things every commitment has, read without asking which kind it is.
 *
 * `Match.valueTags` rather than a shared base class: the variants genuinely
 * differ, and a base class would invite the next field that only three of them
 * have. Each accessor stops compiling when a sixth variant arrives, which is
 * the point.
 */
import { Match } from "effect"

import type {
  Commitment,
  CommitmentId,
  CommitmentKind
} from "@/modules/commitments/core/domain/Commitment"
import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type * as Money from "@/shared/domain/Money"

export const idOf = (commitment: Commitment): CommitmentId => commitment.id

export const householdOf = (commitment: Commitment): HouseholdId => commitment.householdId

export const nameOf = (commitment: Commitment): string => commitment.name

export const isEnabled = (commitment: Commitment): boolean => commitment.enabled

export const kindOf = (commitment: Commitment): CommitmentKind =>
  Match.valueTags(commitment, {
    RecurringExpense: () => "RecurringExpense" as const,
    OneOffExpense: () => "OneOffExpense" as const,
    Debt: () => "Debt" as const,
    TaxLiability: () => "TaxLiability" as const,
    RecurringTaxPayment: () => "RecurringTaxPayment" as const
  })

/**
 * What a row shows as its headline figure. A debt's is its regular payment
 * rather than its balance — the balance is a position, not an amount owed each
 * month, and the two are different questions.
 */
export const headlineAmount = (commitment: Commitment): Money.Money =>
  Match.valueTags(commitment, {
    RecurringExpense: (expense) => expense.amount,
    OneOffExpense: (expense) => expense.amount,
    Debt: (debt) => debt.regularPaymentAmount,
    TaxLiability: (tax) => tax.amount,
    RecurringTaxPayment: (payment) => payment.amount
  })
