/**
 * The form's own state: every field a string, exactly as the inputs produce
 * them, converted once on submit by the use case.
 */
import type { CommitmentKind } from "@/modules/commitments/core/domain/Commitment"
import type { CommitmentDraft } from "@/modules/commitments/core/use_cases/CommitmentDrafts"
import type { HouseholdId } from "@/modules/household/core/domain/Household"

export interface ScheduleRowState {
  readonly date: string
  readonly amountEuros: string
}

export interface CommitmentFormState {
  readonly kind: CommitmentKind
  readonly name: string
  readonly amountEuros: string
  readonly startDate: string
  readonly endDate: string
  readonly oneOffDate: string
  readonly initialAmountEuros: string
  readonly interestRatePercent: string
  readonly regularPaymentEuros: string
  readonly taxYear: string
  readonly taxStatus: "estimated" | "confirmed"
  readonly schedule: ReadonlyArray<ScheduleRowState>
}

export const emptyCommitmentForm: CommitmentFormState = {
  kind: "RecurringExpense",
  name: "",
  amountEuros: "",
  startDate: "",
  endDate: "",
  oneOffDate: "",
  initialAmountEuros: "",
  interestRatePercent: "0",
  regularPaymentEuros: "",
  taxYear: "",
  taxStatus: "confirmed",
  schedule: []
}

const filled = (...values: ReadonlyArray<string>): boolean =>
  values.every((value) => value.trim() !== "")

/**
 * Emptiness only, never validity. Whether 140% is an interest rate is the
 * domain's answer, and a form that pre-judged it would be a second copy of the
 * rule that drifts.
 */
export const isReady = (state: CommitmentFormState): boolean => {
  if (!filled(state.name)) return false
  switch (state.kind) {
    case "RecurringExpense":
    case "RecurringTaxPayment":
      return filled(state.amountEuros, state.startDate)
    case "OneOffExpense":
      return filled(state.amountEuros, state.oneOffDate)
    case "Debt":
      return filled(state.initialAmountEuros, state.regularPaymentEuros, state.startDate)
    case "TaxLiability":
      return filled(state.amountEuros) && state.schedule.length > 0
  }
}

const optional = (value: string) => (value.trim() === "" ? undefined : value)

const monthlyDraft = (
  kind: "RecurringExpense" | "RecurringTaxPayment",
  household: HouseholdId,
  name: string,
  state: CommitmentFormState
): CommitmentDraft =>
  kind === "RecurringExpense"
    ? {
        kind,
        household,
        name,
        amountEuros: Number(state.amountEuros),
        startDate: state.startDate,
        endDate: optional(state.endDate)
      }
    : {
        kind,
        household,
        personId: undefined,
        name,
        amountEuros: Number(state.amountEuros),
        startDate: state.startDate,
        endDate: optional(state.endDate)
      }

const debtDraft = (
  household: HouseholdId,
  name: string,
  state: CommitmentFormState
): CommitmentDraft => ({
  kind: "Debt",
  household,
  name,
  initialAmountEuros: Number(state.initialAmountEuros),
  interestRatePercent: Number(state.interestRatePercent),
  regularPaymentEuros: Number(state.regularPaymentEuros),
  startDate: state.startDate
})

const taxDraft = (
  household: HouseholdId,
  name: string,
  state: CommitmentFormState
): CommitmentDraft => ({
  kind: "TaxLiability",
  household,
  name,
  taxYear: state.taxYear.trim() === "" ? undefined : Number(state.taxYear),
  status: state.taxStatus,
  amountEuros: Number(state.amountEuros),
  schedule: state.schedule.map((row) => ({
    date: row.date,
    amountEuros: Number(row.amountEuros)
  }))
})

export const draftFrom = (household: HouseholdId, state: CommitmentFormState): CommitmentDraft => {
  const name = state.name.trim()
  switch (state.kind) {
    case "OneOffExpense":
      return {
        kind: "OneOffExpense",
        household,
        name,
        amountEuros: Number(state.amountEuros),
        date: state.oneOffDate
      }
    case "Debt":
      return debtDraft(household, name, state)
    case "TaxLiability":
      return taxDraft(household, name, state)
    default:
      return monthlyDraft(state.kind, household, name, state)
  }
}
