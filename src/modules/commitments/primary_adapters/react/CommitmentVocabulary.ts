/** Copy as data, and one sentence per failure a commitment screen can be handed. */
import { Match } from "effect"

import type { AppLayerError } from "@/bootstrap/runtime/AppLayer"
import type { InvalidCommitment } from "@/modules/commitments/core/use_cases/CommitmentFromDraft"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export type CommitmentFailure = AppLayerError | InvalidCommitment | PersistenceError

export const DEFECT_MESSAGE = "Something went wrong. Reloading usually clears this."

export const messageFor = (failure: CommitmentFailure): string =>
  Match.valueTags(failure, {
    InvalidMoney: () => "That is not an amount Delta can record.",
    InvalidLocalDate: () => "That is not a date Delta can read.",
    InvalidPercentage: () => "An interest rate has to be between 0 and 100%.",
    InvalidPeriod: () => "The end date is before the start date.",
    PersistenceError: () => "Could not save that. Your other data is unaffected.",
    SqlError: () => "Could not reach your data. Reloading usually clears this.",
    MigrationError: () => "Delta could not prepare its database on this device."
  })

/** Spec §28: one section, five kinds, each named for what it is. */
export const KIND_LABELS = {
  RecurringExpense: "Recurring",
  OneOffExpense: "One-off",
  Debt: "Debt",
  TaxLiability: "Tax",
  RecurringTaxPayment: "Monthly tax"
} as const

export const COMMITMENTS_COPY = {
  title: "Commitments",
  description: "Everything leaving the household: expenses, debt, and tax.",
  add: "Add commitment",
  empty: "Nothing committed yet",
  emptyDescription:
    "Rent, subscriptions, debt repayments and tax all live here — anything leaving the household on a schedule.",
  totals: {
    title: "What this adds up to",
    monthly: "Every month",
    /** Never added to the monthly figure — their sum is true of no month (CMT-11). */
    scheduled: "Scheduled tax",
    scheduledNote: "Owed on its own dates, so it is not part of the monthly figure.",
    oneOff: "One-off purchases",
    outstandingDebt: "Still owed",
    nothing: "Nothing yet."
  },
  detail: {
    nothingSelected: "Select a commitment to see it in full.",
    initial: "Initial",
    remaining: "Remaining",
    repaid: "repaid",
    payment: "Monthly payment",
    monthsRemaining: "Estimated remaining",
    payoff: "Estimated payoff",
    months: "months",
    noPayoff: "No payoff date — the payment does not reduce the balance.",
    /** Stated where it is shown, because the projection ignores the rate (CMT-06). */
    interestNote: "Projected without interest. Delta records the rate but does not compound it.",
    schedule: "Payment schedule",
    scheduleNote: "Paid on these dates, not as a monthly average.",
    fromSnapshot: "From the balance you recorded.",
    fromInitial: "From the initial amount — no balance recorded yet.",
    recordBalance: "Record what is actually owed",
    balanceDate: "As of",
    balanceAmount: "Still owed (€)",
    recordSave: "Record balance",
    history: "Recorded balances",
    removeSnapshot: "Remove"
  },
  disabled: {
    label: "Off",
    note: "Kept for the record. It produces no cash flow while it is off."
  },
  remove: {
    action: "Delete",
    title: "Delete this commitment?",
    warning: "It is gone for good, and the projection will reach the goal sooner without it.",
    /** CMT-10: say what else goes before it goes. */
    debtWarning: "Every balance you recorded against this debt is deleted with it.",
    alternative: "Switching it off instead keeps the record and can be undone.",
    disableInstead: "Switch off instead",
    confirm: "Delete for good",
    cancel: "Cancel"
  }
} as const
