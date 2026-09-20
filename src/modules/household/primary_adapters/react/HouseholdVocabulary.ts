/**
 * Copy as data (architecture.md — React), including one message per typed
 * error. The error channel of a use case is a closed union, so this is the
 * point where a new failure mode is impossible to forget: `Match.valueTags`
 * stops compiling until it has a sentence.
 */
import { Match } from "effect"

import type { AppLayerError } from "@/bootstrap/runtime/AppLayer"
import type {
  CannotRemoveLastPerson,
  InvalidName,
  NoHousehold
} from "@/modules/household/core/domain/Household"
import type { InvalidPeriod } from "@/modules/household/core/domain/IncomeSource"
import type { InvalidBillableDays } from "@/shared/domain/BillableDays"
import type { InvalidDailyRate } from "@/shared/domain/DailyRate"
import type { InvalidLocalDate } from "@/shared/domain/LocalDate"
import type { InvalidMoney } from "@/shared/domain/Money"
import type { InvalidPayoutRatio } from "@/shared/domain/PayoutRatio"
import type { PersistenceError } from "@/shared/domain/PersistenceError"
import type { InvalidYearMonth } from "@/shared/domain/YearMonth"

/**
 * Every failure a household screen can be handed, which includes the two the
 * runtime layer itself can fail with: an atom built on `appRuntime` never runs
 * at all if the database will not open, and a screen that only knew about
 * domain errors would render that as nothing happening.
 */
export type HouseholdFailure =
  | AppLayerError
  | InvalidName
  | CannotRemoveLastPerson
  | NoHousehold
  | InvalidMoney
  | InvalidDailyRate
  | InvalidPayoutRatio
  | InvalidBillableDays
  | InvalidPeriod
  | InvalidLocalDate
  | InvalidYearMonth
  | PersistenceError

export const messageFor = (failure: HouseholdFailure): string =>
  Match.valueTags(failure, {
    InvalidName: (error) =>
      error.reason === "empty" ? "A name is needed." : "That name is too long.",
    CannotRemoveLastPerson: () => "A household needs at least one person. Add someone else first.",
    NoHousehold: () => "There is no household yet.",
    InvalidMoney: () => "That is not an amount Delta can record.",
    InvalidDailyRate: () => "A daily rate has to be a positive amount.",
    InvalidPayoutRatio: () => "A payout ratio has to be between 0 and 100%.",
    InvalidBillableDays: () => "Billable days have to be between 0 and 31.",
    InvalidPeriod: () => "The end date is before the start date.",
    InvalidLocalDate: () => "That is not a date Delta can read.",
    InvalidYearMonth: () => "That is not a month Delta can read.",
    PersistenceError: () => "Could not save that. Your other data is unaffected.",
    SqlError: () => "Could not reach your data. Reloading usually clears this.",
    MigrationError: () => "Delta could not prepare its database on this device."
  })

/** A defect is a bug, not a condition — the user gets the one honest sentence. */
export const DEFECT_MESSAGE = "Something went wrong. Reloading usually clears this."

export const HOUSEHOLD_COPY = {
  onboarding: {
    title: "Set up your household",
    description:
      "Delta keeps everything on this device. Start with a name for the household and the first person in it.",
    householdLabel: "Household name",
    householdHint: "Only ever shown to you. You can change it later in Settings.",
    personLabel: "First person",
    personHint: "Someone whose income counts toward what you save.",
    submit: "Create household"
  },
  members: {
    householdNameLabel: "Household name",
    rename: "Rename",
    addLabel: "Add someone",
    addHint: "A name is all that is needed. Income can come later.",
    add: "Add person",
    remove: "Remove",
    removeTitle: "Remove this person?",
    /** Spec §40: say what goes with them before it goes. */
    removeWarning:
      "Their income sources are removed too, so the projection will reach the goal later than it does now.",
    removeConfirm: "Remove person",
    cancel: "Cancel",
    noIncome: "No income recorded."
  },
  income: {
    freelance: "Freelance",
    salary: "Salary",
    /** Spec §10: the label is a requirement, not decoration. */
    estimateNote: "An estimate of what reaches you personally, not a guaranteed transfer.",
    perDay: "per day",
    payoutRatio: "payout ratio",
    standardDays: "billable days a month",
    netBeforeTax: "monthly net before tax",
    incomeTax: "monthly income tax",
    netAfterTax: "net after tax",
    annualGross: "annual gross",
    annualGrossNote: "Recorded for reference. It enters no calculation.",
    disabled: "Off",
    disabledNote: "Kept for the record. It produces no income while it is off.",
    until: "until",
    openEnded: "ongoing"
  }
} as const
